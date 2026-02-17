export interface VoteLocalData {
  pollId: number;
  choice: number;
  salt: string;
  txHash: string;
  status: 'committed' | 'revealed';
}

const STORAGE_KEY = 'starkvote_local_votes';

export function saveVoteLocally(vote: VoteLocalData) {
  const votes = getLocalVotes();
  votes.push(vote);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

export function getLocalVotes(): VoteLocalData[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getVoteForPoll(pollId: number): VoteLocalData | undefined {
  return getLocalVotes().find(v => v.pollId === pollId);
}

export function updateVoteStatus(pollId: number, status: 'revealed') {
  const votes = getLocalVotes();
  const index = votes.findIndex(v => v.pollId === pollId);
  if (index !== -1) {
    votes[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  }
}
