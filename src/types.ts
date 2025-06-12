export type Nft = {
  id: number;
  name: string;
  description: string;
  image: string;
};
export type CollectionInfo = {
  balance: bigint;
  drop: boolean | null;
  dropStart: number;
  autoIncrement: boolean | null;
  maxSupply: bigint;
  name: string;
  price: bigint;
  reserve: bigint;
  revokable: boolean | null;
  soulbound: boolean | null;
  symbol: string;
  totalSupply: number;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
