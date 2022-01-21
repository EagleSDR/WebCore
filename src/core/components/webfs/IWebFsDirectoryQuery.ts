import IWebFsDirectoryQueryDir from "./IWebFsDirectoryQueryDir";
import IWebFsDirectoryQueryFile from "./IWebFsDirectoryQueryFile";

export default interface IWebFsDirectoryQuery {

    files: IWebFsDirectoryQueryFile[];
    subdirectories: IWebFsDirectoryQueryDir[];
    name: string;
    path: string[];
    volume: string;

}