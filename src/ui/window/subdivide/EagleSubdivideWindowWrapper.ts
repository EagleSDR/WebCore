import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindow from "../EagleWindow";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowContainer from "../IEagleWindowContainer";
import IEagleSubdivideItem from "./IEagleSubdivideItem";
import IEagleSubdivideItemParent from "./IEagleSubdivideItemParent";

export default class EagleSubdivideWindowWrapper implements IEagleSubdivideItem, IEagleWindowContainer {

    constructor(win: EagleWindow) {
        this.win = win;
        this.node = EagleUtil.CreateElement("div", null);
        this.win.ChangeContainer(this, this.node);
    }

    private parent: IEagleSubdivideItemParent;
    private win: EagleWindow;
    private node: HTMLElement;
    private width: number;
    private height: number;

    SetParent(parent: IEagleSubdivideItemParent): HTMLElement {
        this.parent = parent;
        return this.node;
    }

    Resize(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.win.SetSize(width, height);
    }

    /* WINDOW */

    Detach(): void {
        this.parent.RequestRemoval();
    }

    WindowMoveRequested(deltaX: number, deltaY: number): void {
        this.win.PopOutWindow(this.width, this.height);
    }

    WindowMoveEnd(): void {

    }

    WindowResizeRequested(deltaX: number, deltaY: number): void {
        
    }

    WindowResizeEnd(): void {

    }

    ShowWindowBorder(): boolean {
        return false;
    }

}