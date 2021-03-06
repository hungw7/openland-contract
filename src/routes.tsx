import React from "react";

const AllNFTsPage = React.lazy(() => import("./features/allNFTs"));
const Collections = React.lazy(() => import("./features/collections"));
const Collection = React.lazy(() => import("./features/collection"));
const Item = React.lazy(() => import("./features/itemDetails"));
const Profile = React.lazy(() => import("./features/profile"))
const ProfileOther = React.lazy(() => import("./features/profileOther"))
const CreateNFT = React.lazy(() => import("./features/createNFT"))
const CreateCollection = React.lazy(() => import("./features/createCollection"))

export const ALL_NFTS_PATH = "/explore-all-nfts";
export const ALL_COLLECTIONS_PATH = "/explore-collections";
export const COLLECTION_PATH = "/collection";
export const HOME_PATH = "/home";
export const PROFILE_PATH = '/profile'
export const LOGIN_PATH = '/'
export const ITEM_PATH = "/collection/:token/item/:tokenId"
export const CREATE_NFT_PATH = '/create'
export const PROFILE_OTHER_PATH = '/:address'
export const CREATE_COLLECTION_PATH = '/collection/create'

type routeType = {
    path: string;
    element: JSX.Element;
};

const publicRoute: routeType[] = [
    {
        path: ALL_NFTS_PATH,
        element: <AllNFTsPage />,
    },
    {
        path: ALL_COLLECTIONS_PATH,
        element: <Collections />,
    },
    {
        path: COLLECTION_PATH + "/:token",
        element: <Collection />,
    },
    {
        path: ITEM_PATH,
        element: <Item />,
    },
    {
        path: PROFILE_OTHER_PATH,
        element: <ProfileOther />,
    },
];

const commonRoute: routeType[] = [];

const protectedRoute: routeType[] = [
    {
        path: PROFILE_PATH,
        element: <Profile />,
    },
    {
        path: CREATE_NFT_PATH,
        element: <CreateNFT />,
    },
    {
        path: CREATE_COLLECTION_PATH,
        element: <CreateCollection />,
    }
];

const routes = {
    publicRoute,
    protectedRoute,
    commonRoute,
};

export default routes;
