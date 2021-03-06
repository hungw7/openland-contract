import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import styles from "./itemDetailsStyles.module.scss";

import Divider from "@mui/material/Divider";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import CancelIcon from "@mui/icons-material/Cancel";
import BallotIcon from "@mui/icons-material/Ballot";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FormatAlignJustifyIcon from "@mui/icons-material/FormatAlignJustify";

import Collection from "./components/collection";
import PlaceBid from "./components/placeBid";
import Buy from "./components/buy";
import Resell from "./components/resell";
import Auction from "./components/auction";

import { IItemModel, IItemMetadataModel } from "../../model/Item.model";
import { http } from "../../services/AxiosHelper";
import {
    ALL_ITEMS,
    GET_IPFS,
    GET_ITEM_BY_TOKEN,
    GET_ITEM_BY_TOKENID,
    UPDATE_ITEM_OWNER,
    UPDATE_ITEM_STATUS
} from "../../services/APIurls";
import formatAddress from "../../utils/formatAddress";
import SvgEthIcon from "../svg/svgEthIcon";
import { ethers } from "ethers";
import ListIcon from "@mui/icons-material/List";
import { sliceString } from "../../utils/strimString";
import { COLLECTION_PATH } from "../../routes";
import { useAppSelector, useAppDispatch } from "../../hooks";

import ExchangeSell from "../../abi/contracts/exchange/ExchangeSell.sol/ExchangeSell.json";
import ExchangeAuction from "../../abi/contracts/exchange/ExchangeAuction.sol/ExchangeAuction.json";
import ERC721Land from "../../abi/contracts/token/ERC721Land.sol/ERC721Land.json";

import { contractAddresses } from "../../config";
import { pushNotify, removeNotify } from "../../components/Notify/notifySlice";
import { isBidding } from "./helper";

const ITEM_STATUS = {
    BID: 2,
    SALE: 1,
    NULL: 0
};
export default function Item() {
    const params = useParams();
    const dispatch = useAppDispatch();
    const me = useAppSelector((state) => state.wallet.walletInfo);

    const navigate = useNavigate();
    const [item, setItem] = useState<IItemModel>();
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isCancel, setIsCancel] = useState<boolean>(false);

    const [openPlaceBid, setOpenPlaceBid] = useState<boolean>(false);
    const [pricePlaceBid, setPricePlaceBid] = useState<number>(0);
    const [openBuy, setOpenBuy] = useState<boolean>(false);
    const [openResell, setOpenResell] = useState<boolean>(false);
    const [openAuction, setOpenAuction] = useState<boolean>(false);

    const handleClosePlaceBid = () => {
        setOpenPlaceBid(false);
    };
    const handleOpenPlaceBid = () => {
        setOpenPlaceBid(true);
    };
    const handleOpenBuy = () => setOpenBuy(true);
    const handleCloseBuy = () => setOpenBuy(false);

    const handleOpenResell = () => setOpenResell(true);
    const handleCloseResell = () => setOpenResell(false);

    const handleOpenAuction = () => setOpenAuction(true);
    const handleCloseAuction = () => setOpenAuction(false);

    const currentSigner = useAppSelector((state) => state.wallet.signer);
    const currentAddress = useAppSelector((state) => state.wallet.address);

    const handleCancel = async () => {
        setIsCancel(true);
        // call cancel func in contract

        var exchangeSellContract = new ethers.Contract(
            contractAddresses.exchangeSell,
            ExchangeSell.abi,
            currentSigner
        );
        const txDelist = await exchangeSellContract.delist(
            item?.token,
            item?.tokenId
        );
        const txDelistReceipt = await txDelist.wait();

        // call api
        const resUpdateStatus = await http.put(UPDATE_ITEM_STATUS, {
            token: item?.token,
            tokenId: item?.tokenId,
            status: 0
        });
        console.log(resUpdateStatus);

        const notify = {
            id: Date.now().toString(),
            type: "success",
            message: "Cancel sell successfully."
        };
        dispatch(pushNotify(notify));
        setTimeout(() => {
            dispatch(removeNotify(notify));
        }, 5000);
    };

    const handleEndAuction = async () => {
        //logic for END AUCTION

        setIsCancel(true);
        // // call cancel func in contract
        const exchangeAuctionContract = new ethers.Contract(
            contractAddresses.exchangeAuction,
            ExchangeAuction.abi,
            currentSigner
        );

        const txEnd = await exchangeAuctionContract.end(
            item?.token,
            item?.tokenId
        );
        const txEndReceipt = await txEnd.wait();

        console.log(txEndReceipt);

        // call api
        const resUpdateStatus = await http.put(UPDATE_ITEM_STATUS, {
            token: item?.token,
            tokenId: item?.tokenId,
            status: 0
        });

        const erc721Contract = new ethers.Contract(
            item?.token!,
            ERC721Land.abi,
            currentSigner
        );
        const newOwner = await erc721Contract.ownerOf(item?.tokenId);

        const resUpdateOwner = await http.put(UPDATE_ITEM_OWNER, {
            token: item?.token,
            tokenId: item?.tokenId,
            owner: newOwner
        });
        console.log(resUpdateOwner);

        const notify = {
            id: Date.now().toString(),
            type: "success",
            message: "End Auction successfully."
        };
        dispatch(pushNotify(notify));
        setTimeout(() => {
            dispatch(removeNotify(notify));
        }, 5000);
    };

    useEffect(() => {
        const fetchData = async () => {
            const newItem: IItemModel = (
                await http.get<IItemModel[]>(
                    GET_ITEM_BY_TOKENID + `/${params.token}/${params.tokenId}`
                )
            ).data[0];
            // if (newItem) {
            //     const newMetaData: IItemMetadataModel = (
            //         await http.get<IItemMetadataModel>(newItem.ipfsUrl!)
            //     ).data;
            //     newItem.metadata = newMetaData;
            // }
            setItem(newItem);

            const splitedIpfs = newItem.ipfsUrl?.split("/");
            const cid = splitedIpfs[2];

            const metadata: IItemMetadataModel = (
                await http.get<IItemMetadataModel>(GET_IPFS + `/${cid}`)
            ).data;

            if (metadata) {
                setItem({ metadata, ...newItem });
            }
        };

        fetchData();
    }, [params]);

    useEffect(() => {
        if (item) {
            setIsOwner(me?.address === item.owner);
            setIsCancel(item.status === 0);
        }
    }, [item]);

    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <div className={styles.left}>
                    <div
                        className={styles.img}
                        style={{ backgroundImage: `url(${item?.thumbLink})` }}
                    ></div>
                    <div className={styles.info}>
                        <div className={styles.description}>
                            <div className={styles.title}>
                                <FormatAlignJustifyIcon
                                    sx={{ fontSize: 24 }}
                                ></FormatAlignJustifyIcon>
                                <div>Description</div>
                            </div>
                            <Divider></Divider>
                            <div className={styles.content}>
                                {item?.metadata?.description}
                            </div>
                        </div>

                        <Divider></Divider>

                        <div className={styles.details}>
                            <div className={styles.title}>
                                <BallotIcon sx={{ fontSize: 24 }} />
                                <div>Details</div>
                            </div>
                            <Divider></Divider>
                            <div className={styles.content}>
                                <div className={styles.row}>
                                    <div>Contract address</div>
                                    {/* <div>{formatAddress(item?.owner)}</div> */}
                                    <div>
                                        <div
                                            className={styles.address}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    item?.token!
                                                );
                                                const notify = {
                                                    id: Date.now().toString(),
                                                    type: "success",
                                                    message: "Copied."
                                                };
                                                dispatch(pushNotify(notify));
                                                setTimeout(() => {
                                                    dispatch(
                                                        removeNotify(notify)
                                                    );
                                                }, 5000);
                                            }}
                                        >
                                            <div>
                                                {formatAddress(item?.token!)}
                                            </div>
                                            <ContentCopyIcon
                                                sx={{ fontSize: 20 }}
                                            ></ContentCopyIcon>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.row}>
                                    <div>Token ID</div>
                                    <div>{formatAddress(item?.tokenId)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* right */}
                <div className={styles.right}>
                    <div
                        onClick={() => {
                            navigate(`/collection/${item?.token}`);
                        }}
                        className={styles["collection-name"]}
                    >
                        {item?.collectionName}
                    </div>
                    <div className={styles["name"]}>{item?.name}</div>
                    <p className={styles["author"]}>
                        Owned by{" "}
                        <span
                            style={{ color: "var(--primaryColor)" }}
                            className={styles.link}
                        >
                            {!item?.ownerDisplay
                                ? formatAddress(item?.owner)
                                : item?.ownerDisplay}
                        </span>
                    </p>
                    {isOwner && isCancel && (
                        <p className={styles["author"]}>Item is canceled</p>
                    )}

                    {(isOwner || !isCancel) && (
                        <div className={styles["box-buynow"]}>
                            {item?.status === ITEM_STATUS.BID && (
                                <React.Fragment>
                                    <div className={styles.saleEnd}>
                                        Sale end at {item?.endAt?.toString()}
                                    </div>
                                    <Divider></Divider>
                                </React.Fragment>
                            )}
                            <div className={styles.buttonArea}>
                                <div className={styles.price}>
                                    <div
                                        style={{
                                            fontSize: 16,
                                            fontWeight: "normal"
                                        }}
                                    >
                                        {item?.status === ITEM_STATUS.SALE
                                            ? "Current price"
                                            : item?.status === ITEM_STATUS.BID
                                            ? "Minimum bid"
                                            : "Unsell"}
                                    </div>
                                    <div>
                                        {item &&
                                            ethers.utils.formatEther(
                                                item.price
                                            )}{" "}
                                        <span>
                                            <SvgEthIcon
                                                style={{
                                                    marginRight: "8px",
                                                    width: "16px",
                                                    height: "16px"
                                                }}
                                            />
                                        </span>
                                    </div>
                                </div>

                                {!isOwner && (
                                    <div
                                        className={styles.button}
                                        onClick={
                                            item?.status === ITEM_STATUS.SALE
                                                ? handleOpenBuy
                                                : handleOpenPlaceBid
                                        }
                                    >
                                        <AccountBalanceWalletIcon
                                            sx={{ fontSize: 28 }}
                                        ></AccountBalanceWalletIcon>
                                        <div>
                                            {item?.status === ITEM_STATUS.SALE
                                                ? "Buy now"
                                                : "Place bid"}
                                        </div>
                                    </div>
                                )}

                                {isOwner &&
                                    !isCancel &&
                                    item?.status === ITEM_STATUS.SALE && (
                                        <div
                                            className={styles.button}
                                            style={{
                                                backgroundColor: "#c35555"
                                            }}
                                            onClick={handleCancel}
                                        >
                                            <CancelIcon
                                                sx={{ fontSize: 28 }}
                                            ></CancelIcon>
                                            <div>Cancel</div>
                                        </div>
                                    )}

                                {isOwner &&
                                    !isCancel &&
                                    item?.status === ITEM_STATUS.BID && (
                                        <div
                                            className={
                                                styles[
                                                    isBidding(item?.endAt)
                                                        ? "button_disable"
                                                        : "button"
                                                ]
                                            }
                                            style={{
                                                backgroundColor: isBidding(item?.endAt) ? "#868686":"#c35555",
                                            }}
                                            onClick={
                                                isBidding(item?.endAt)
                                                    ? undefined
                                                    : handleEndAuction
                                            }
                                        >
                                            <CancelIcon
                                                sx={{ fontSize: 28 }}
                                            ></CancelIcon>
                                            <div>End Auction</div>
                                        </div>
                                    )}
                            </div>
                        </div>
                    )}

                    {isOwner && isCancel && (
                        <div className={styles.box_sell_bid}>
                            <div
                                className={styles.btn}
                                onClick={handleOpenResell}
                            >
                                <AccountBalanceWalletIcon
                                    sx={{ fontSize: 28 }}
                                ></AccountBalanceWalletIcon>
                                <div>Sell</div>
                            </div>
                            <div
                                className={styles.btn}
                                onClick={handleOpenAuction}
                            >
                                <AccountBalanceWalletIcon
                                    sx={{ fontSize: 28 }}
                                ></AccountBalanceWalletIcon>
                                <div>Auction</div>
                            </div>
                        </div>
                    )}
                    {/* <div className={styles.boxPriceList}>
                        <div className={styles.title}>
                            <ShowChartIcon
                                sx={{ fontSize: 24 }}
                            ></ShowChartIcon>
                            <div>Price History</div>
                        </div>
                        <Divider></Divider>
                        <div className={styles.chartArea}>
                            <div className={styles.scrollable}>
                                {mockAPI.priceHistory.map((item, idx) => {
                                    return (
                                        <div
                                            key={idx}
                                            className={styles.priceRow}
                                        >
                                            <div>{item.price}</div>
                                            <div>{item.owner}</div>
                                            <div>{item.time}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div> */}
                    <div className={styles.properties}>
                        <div className={styles.info}>
                            <div className={styles.properties}>
                                <div className={styles.title}>
                                    <ListIcon sx={{ fontSize: 24 }} />

                                    <div>Properties</div>
                                </div>
                                <Divider></Divider>
                                <div className={styles.content}>
                                    {item?.metadata?.properties &&
                                        item?.metadata?.properties.map(
                                            (item, idx) => (
                                                <div
                                                    className={styles.property}
                                                    key={idx}
                                                >
                                                    <div
                                                        className={styles.type}
                                                    >
                                                        {sliceString(
                                                            item.type,
                                                            10
                                                        )}
                                                    </div>
                                                    <div
                                                        className={styles.name}
                                                    >
                                                        {sliceString(
                                                            item.name,
                                                            10
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Collection token={params.token!}></Collection>

            <div
                className={styles.viewCollection}
                onClick={() => navigate(COLLECTION_PATH + `/${item?.token}`)}
            >
                <div className={styles.button}>View collection</div>
            </div>

            {item && (
                <PlaceBid
                    open={openPlaceBid}
                    setOpen={setOpenPlaceBid}
                    handleClose={handleClosePlaceBid}
                    price={pricePlaceBid}
                    setPrice={setPricePlaceBid}
                    minBid={ethers.utils.formatEther(item ? item.price : "0")}
                    item={item}
                />
            )}
            {item && (
                <Buy
                    open={openBuy}
                    handleClose={handleCloseBuy}
                    setOpen={setOpenBuy}
                    item={item}
                ></Buy>
            )}
            {item && (
                <Resell
                    open={openResell}
                    setOpen={setOpenResell}
                    handleClose={handleCloseResell}
                    item={item}
                ></Resell>
            )}
            {item && (
                <Auction
                    open={openAuction}
                    setOpen={setOpenAuction}
                    handleClose={handleCloseAuction}
                    item={item}
                ></Auction>
            )}
        </div>
    );
}
