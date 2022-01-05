import IEagleSubdivideItemParent from "./IEagleSubdivideItemParent";

export default interface IEagleSubdivideItem {

    SetParent(parent: IEagleSubdivideItemParent): HTMLElement;
    Resize(width: number, height: number): void;

}