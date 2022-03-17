import React, { useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Col, Empty, Row, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { fetchNftsFromWallet } from '../api/fetchNftsFromWallet';
import { Nft } from '../components/Nft';
import { CandyShop } from './CandyShop';
import { SingleTokenInfo } from '../api/fetchMetadata';
import { fetchOrdersByStoreIdAndWalletAddress } from '../api/backend/OrderAPI';
import { Order as OrderSchema } from 'solana-candy-shop-schema/dist';

interface SellProps {
  connection: Connection;
  walletPublicKey?: PublicKey;
  candyShop: CandyShop;
  walletConnectComponent: React.ReactElement;
}

/**
 * React component that allows user to put an NFT for sale
 */
export const Sell: React.FC<SellProps> = ({
  walletPublicKey,
  connection,
  candyShop,
  walletConnectComponent,
}) => {
  const [nfts, setNfts] = useState<SingleTokenInfo[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderSchema[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [shopId, setShopId] = useState<string>();

  useEffect(() => {
    candyShop && setShopId(candyShop.candyShopAddress.toString());
  }, [candyShop]);

  useEffect(() => {
    if (connection && walletPublicKey && shopId) {
      (async () => {
        setIsLoading(true);
        let [userNfts, sellOrders] = await Promise.all([
          fetchNftsFromWallet(connection, walletPublicKey),
          fetchOrdersByStoreIdAndWalletAddress(
            shopId,
            walletPublicKey.toString()
          ),
        ]);
        setNfts(userNfts);
        setSellOrders(sellOrders);
        setIsLoading(false);
      })();
    }
  }, [connection, walletPublicKey, shopId]);

  const hashSellOrders = useMemo(() => {
    return (
      sellOrders?.reduce((acc: any, item: OrderSchema) => {
        acc[item.tokenMint] = item;
        return acc;
      }, {}) || {}
    );
  }, [sellOrders]);

  console.log({ hashSellOrders, sellOrders, nfts });

  if (!walletPublicKey) {
    return (
      <div className="candy-shop-list" style={{ textAlign: 'center' }}>
        {walletConnectComponent}
      </div>
    );
  }

  return (
    <div className="candy-shop-list">
      <Row
        gutter={[
          { md: 24, xs: 16 },
          { md: 24, xs: 16 },
        ]}
      >
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, key) => (
              <Col key={key} md={8} xs={24}>
                <Skeleton />
              </Col>
            ))
        ) : !nfts.length ? (
          <Col span={24}>
            <Empty description="No NFTs found" />
          </Col>
        ) : (
          nfts?.map((item, key) => (
            <Col key={key} md={8} xs={24}>
              <Nft
                nft={item}
                candyShop={candyShop}
                sellDetail={hashSellOrders[item.tokenMintAddress]}
              />
            </Col>
          ))
        )}
      </Row>
    </div>
  );
};
