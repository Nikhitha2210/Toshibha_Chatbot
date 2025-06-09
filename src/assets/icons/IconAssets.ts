import Logo from './logo.svg';
import Menu from './Menu.svg';
import Lock from './lock.svg';
import Mail from './Mail.svg';
import Solid from './Solid.svg';
import Speedometer from './Speedometer.svg';
import Microphone from './microphone.svg';
import VerticalDots from './dots-vertical.svg';
import Frame from './Frame.svg';
import ThumbsUp from './thumbs-up.svg';
import ThumbsDown from './thumbs-down.svg';
import Flag from './Flag.svg';
import Copy from './Copy.svg';
import Refresh from './Refresh.svg';
import Send from './Send.svg';
import Arrow from './Arrow.svg';
import ThumbsUpBold from './thumbs-up-bold.svg';
import ThumbsDownBold from './thumbs-down-bold.svg';

import NewChatDark from './dark/Newchat.svg';
import SearchDark from './dark/Search.svg';
import ArrowLeftDark from './dark/ArrowLeft.svg';
import CloseDark from './dark/Close.svg';
import FolderDark from './dark/Folder.svg';
import StarDark from './dark/Star.svg'
import SettingsDark from './dark/Settings.svg'
import FilterDark from './dark/Filter.svg';

import NewChatLight from './light/NewChat.svg';
import SearchLight from './light/Search.svg';
// import ArrowLeftLight from './light/ArrowLeft.svg';
import CloseLight from './light/Close.svg';
import FolderLight from './light/Folder.svg';
import StarLight from './light/Star.svg';
import SettingsLight from './light/Settings.svg';
import FilterLight from './light/Filter.svg';

const icons = {
    Logo,
    Menu,
    Lock,
    Mail,
    Solid,
    Speedometer,
    Microphone,
    VerticalDots,
    Frame,
    ThumbsUp,
    ThumbsDown,
    Flag,
    Copy,
    Refresh,
    Send,
    Arrow,
    ThumbsUpBold,
    ThumbsDownBold,

    // Dark
    NewChatDark,
    SearchDark,
    ArrowLeftDark,
    CloseDark,
    FolderDark,
    StarDark,
    SettingsDark,
    FilterDark,

    // Light
    NewChatLight,
    SearchLight,
    // ArrowLeftLight,
    CloseLight,
    FolderLight,
    StarLight,
    SettingsLight,
    FilterLight,
};

const themedIconMap = {
    Search: {
        dark: SearchDark,
        light: SearchLight,
    },
    NewChat: {
        dark: NewChatDark,
        light: NewChatLight,
    },
    ArrowLeft: {
        dark: ArrowLeftDark,
        light: ArrowLeftDark,
    },
    Close: {
        dark: CloseDark,
        light: CloseLight,
    },
    Folder: {
        dark: FolderDark,
        light: FolderLight,
    },
    Star: {
        dark: StarDark,
        light: StarLight,
    },
    Settings: {
        dark: SettingsDark,
        light: SettingsLight,
    },
    Filter: {
        dark: FilterDark,
        light: FilterLight,
    },
};

export const getThemedIcon = (
    name: keyof typeof themedIconMap,
    theme: 'dark' | 'light'
) => {
    return themedIconMap[name]?.[theme];
};

export default icons;
