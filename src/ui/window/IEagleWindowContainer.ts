import EagleWindow from "./EagleWindow";

export default interface IEagleWindowContainer {

    Detach(): void; //Called when removed. Don't touch the DOM.

    ShowWindowBorder(): boolean;

    WindowMoveRequested(deltaX: number, deltaY: number): void;
    WindowMoveEnd(): void;
    WindowResizeRequested(deltaX: number, deltaY: number): void;
    WindowResizeEnd(): void;

    WindowMadeActive(): void;
    WindowMadeInactive(): void;

}