#[starknet::interface]
trait IAuction<TContractState> {
    fn create_auction(ref self: TContractState, bidding_end: u64, reveal_end: u64) -> u64;
    fn commit_bid(ref self: TContractState, auction_id: u64, bid_hash: felt252);
    fn reveal_bid(ref self: TContractState, auction_id: u64, amount: u128, salt: felt252);
    fn get_auction_info(self: @TContractState, auction_id: u64) -> (felt252, u64, u64, felt252, u128);
    fn get_bid_commitment(self: @TContractState, auction_id: u64, bidder: starknet::ContractAddress) -> felt252;
}

#[starknet::contract]
mod Auction {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        auction_count: u64,
        auctions: LegacyMap::<u64, AuctionDetails>,
        commitments: LegacyMap::<(u64, ContractAddress), felt252>,
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct AuctionDetails {
        seller: ContractAddress,
        bidding_end: u64,
        reveal_end: u64,
        highest_bidder: ContractAddress,
        highest_bid: u128,
        finalized: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        AuctionCreated: AuctionCreated,
        BidCommitted: BidCommitted,
        BidRevealed: BidRevealed,
        AuctionFinalized: AuctionFinalized,
    }

    #[derive(Drop, starknet::Event)]
    struct AuctionCreated {
        #[key]
        auction_id: u64,
        seller: ContractAddress,
        bidding_end: u64,
        reveal_end: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct BidCommitted {
        #[key]
        auction_id: u64,
        #[key]
        bidder: ContractAddress,
        commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct BidRevealed {
        #[key]
        auction_id: u64,
        #[key]
        bidder: ContractAddress,
        amount: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct AuctionFinalized {
        #[key]
        auction_id: u64,
        winner: ContractAddress,
        amount: u128,
    }

    #[abi(embed_v0)]
    impl AuctionImpl of super::IAuction<ContractState> {
        fn create_auction(ref self: ContractState, bidding_end: u64, reveal_end: u64) -> u64 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            assert(bidding_end > current_time, 'Bidding end must be future');
            assert(reveal_end > bidding_end, 'Reveal end must be > bidding');

            let auction_id = self.auction_count.read() + 1;
            self.auction_count.write(auction_id);

            let new_auction = AuctionDetails {
                seller: caller,
                bidding_end,
                reveal_end,
                highest_bidder: starknet::contract_address_const::<0>(),
                highest_bid: 0,
                finalized: false,
            };

            self.auctions.write(auction_id, new_auction);

            self.emit(AuctionCreated {
                auction_id,
                seller: caller,
                bidding_end,
                reveal_end,
            });

            auction_id
        }

        fn commit_bid(ref self: ContractState, auction_id: u64, bid_hash: felt252) {
            let caller = get_caller_address();
            let auction = self.auctions.read(auction_id);
            let current_time = get_block_timestamp();

            assert(current_time < auction.bidding_end, 'Bidding phase ended');
            assert(bid_hash != 0, 'Invalid commitment');

            self.commitments.write((auction_id, caller), bid_hash);

            self.emit(BidCommitted {
                auction_id,
                bidder: caller,
                commitment: bid_hash,
            });
        }

        fn reveal_bid(ref self: ContractState, auction_id: u64, amount: u128, salt: felt252) {
            let caller = get_caller_address();
            let mut auction = self.auctions.read(auction_id);
            let current_time = get_block_timestamp();

            assert(current_time >= auction.bidding_end, 'Reveal phase not started');
            assert(current_time < auction.reveal_end, 'Reveal phase ended');

            let stored_commitment = self.commitments.read((auction_id, caller));
            assert(stored_commitment != 0, 'No bid committed');

            let mut hash_input = ArrayTrait::new();
            hash_input.append(amount.into());
            hash_input.append(salt);
            let calculated_hash = poseidon_hash_span(hash_input.span());

            assert(calculated_hash == stored_commitment, 'Invalid secret or amount');

            if amount > auction.highest_bid {
                auction.highest_bid = amount;
                auction.highest_bidder = caller;
                self.auctions.write(auction_id, auction);
            }

            self.emit(BidRevealed {
                auction_id,
                bidder: caller,
                amount,
            });
        }

        fn get_auction_info(self: @ContractState, auction_id: u64) -> (felt252, u64, u64, felt252, u128) {
            let auction = self.auctions.read(auction_id);
            (auction.seller.into(), auction.bidding_end, auction.reveal_end, auction.highest_bidder.into(), auction.highest_bid)
        }

        fn get_bid_commitment(self: @ContractState, auction_id: u64, bidder: ContractAddress) -> felt252 {
            self.commitments.read((auction_id, bidder))
        }
    }
}
