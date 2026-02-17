#[starknet::interface]
trait IVoting<TContractState> {
    fn create_poll(ref self: TContractState, voting_end: u64, reveal_end: u64) -> u64;
    fn commit_vote(ref self: TContractState, poll_id: u64, vote_hash: felt252);
    fn reveal_vote(ref self: TContractState, poll_id: u64, choice: u128, salt: felt252);
    fn get_poll_info(self: @TContractState, poll_id: u64) -> (felt252, u64, u64, u128, u128); // creator, voting_end, reveal_end, option_1_votes, option_2_votes
    fn get_vote_commitment(self: @TContractState, poll_id: u64, voter: starknet::ContractAddress) -> felt252;
}

#[starknet::contract]
mod PrivateVoting {
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use core::poseidon::poseidon_hash_span;

    #[storage]
    struct Storage {
        poll_count: u64,
        polls: LegacyMap::<u64, PollDetails>,
        commitments: LegacyMap::<(u64, ContractAddress), felt252>,
        // Tracking if a voter already revealed to prevent double counting
        has_revealed: LegacyMap::<(u64, ContractAddress), bool>,
    }

    #[derive(Drop, Serde, starknet::Store)]
    struct PollDetails {
        creator: ContractAddress,
        voting_end: u64,
        reveal_end: u64,
        option_1_votes: u128,
        option_2_votes: u128,
        finalized: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PollCreated: PollCreated,
        VoteCommitted: VoteCommitted,
        VoteRevealed: VoteRevealed,
        PollFinalized: PollFinalized,
    }

    #[derive(Drop, starknet::Event)]
    struct PollCreated {
        #[key]
        poll_id: u64,
        creator: ContractAddress,
        voting_end: u64,
        reveal_end: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteCommitted {
        #[key]
        poll_id: u64,
        #[key]
        voter: ContractAddress,
        commitment: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct VoteRevealed {
        #[key]
        poll_id: u64,
        #[key]
        voter: ContractAddress,
        choice: u128,
    }

    #[derive(Drop, starknet::Event)]
    struct PollFinalized {
        #[key]
        poll_id: u64,
        option_1_total: u128,
        option_2_total: u128,
    }

    #[abi(embed_v0)]
    impl VotingImpl of super::IVoting<ContractState> {
        fn create_poll(ref self: ContractState, voting_end: u64, reveal_end: u64) -> u64 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            
            assert(voting_end > current_time, 'Voting end must be future');
            assert(reveal_end > voting_end, 'Reveal end must be > voting');

            let poll_id = self.poll_count.read() + 1;
            self.poll_count.write(poll_id);

            let new_poll = PollDetails {
                creator: caller,
                voting_end,
                reveal_end,
                option_1_votes: 0,
                option_2_votes: 0,
                finalized: false,
            };

            self.polls.write(poll_id, new_poll);

            self.emit(PollCreated {
                poll_id,
                creator: caller,
                voting_end,
                reveal_end,
            });

            poll_id
        }

        fn commit_vote(ref self: ContractState, poll_id: u64, vote_hash: felt252) {
            let caller = get_caller_address();
            let poll = self.polls.read(poll_id);
            let current_time = get_block_timestamp();

            assert(current_time < poll.voting_end, 'Voting phase ended');
            assert(vote_hash != 0, 'Invalid commitment');

            self.commitments.write((poll_id, caller), vote_hash);

            self.emit(VoteCommitted {
                poll_id,
                voter: caller,
                commitment: vote_hash,
            });
        }

        fn reveal_vote(ref self: ContractState, poll_id: u64, choice: u128, salt: felt252) {
            let caller = get_caller_address();
            let mut poll = self.polls.read(poll_id);
            let current_time = get_block_timestamp();

            assert(current_time >= poll.voting_end, 'Reveal phase not started');
            assert(current_time < poll.reveal_end, 'Reveal phase ended');
            assert(!self.has_revealed.read((poll_id, caller)), 'Already revealed');

            let stored_commitment = self.commitments.read((poll_id, caller));
            assert(stored_commitment != 0, 'No vote committed');

            let mut hash_input = ArrayTrait::new();
            hash_input.append(choice.into());
            hash_input.append(salt);
            let calculated_hash = poseidon_hash_span(hash_input.span());

            assert(calculated_hash == stored_commitment, 'Invalid secret or choice');

            if choice == 1 {
                poll.option_1_votes += 1;
            } else if choice == 2 {
                poll.option_2_votes += 1;
            } else {
                assert(false, 'Invalid choice');
            }

            self.has_revealed.write((poll_id, caller), true);
            self.polls.write(poll_id, poll);

            self.emit(VoteRevealed {
                poll_id,
                voter: caller,
                choice,
            });
        }

        fn get_poll_info(self: @ContractState, poll_id: u64) -> (felt252, u64, u64, u128, u128) {
            let poll = self.polls.read(poll_id);
            (poll.creator.into(), poll.voting_end, poll.reveal_end, poll.option_1_votes, poll.option_2_votes)
        }

        fn get_vote_commitment(self: @ContractState, poll_id: u64, voter: ContractAddress) -> felt252 {
            self.commitments.read((poll_id, voter))
        }
    }
}
