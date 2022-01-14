import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindowMountControl from "../control/EagleWindowMountControl";
import EagleWindow from "../EagleWindow";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowContainer from "../IEagleWindowContainer";
import IEagleWindowLayer from "../IEagleWindowLayer";

const ELEMENT_SPACING: number = 5;
const SAVE_VERSION: number = 1;

enum EagleSubdivideAxis {

    LeftRight,
    TopDown

}

enum EagleSubdivideDirection {

    Top,
    Left,
    Right,
    Bottom

}

interface ISavedDataCell {
    content: any,
    direction: string,
    cells: ISavedDataCell[]
}

interface ISavedData {
    version: number,
    height: number,
    width: number,
    cells: ISavedDataCell[]
}

abstract class EagleSubdivideContainerBase {

    constructor(mount: HTMLElement, axis: EagleSubdivideAxis, manager: EagleWindowManager) {
        this.mount = mount;
        this.axis = axis;
        this.content = new EagleSubdivideWindow(this, this.mount);
        this.manager = manager;
    }

    protected mount: HTMLElement;
    protected axis: EagleSubdivideAxis;
    protected content: EagleSubdivideWindow;
    protected manager: EagleWindowManager;

    protected width: number = 0;
    protected height: number = 0;
    protected cells: EagleSubdivideContainerChild[] = [];

    GetAxis(): EagleSubdivideAxis {
        return this.axis;
    }

    GetWindowManager(): EagleWindowManager {
        return this.manager;
    }

    Save(): any {
        return {
            "content": this.content.Save(),
            "direction": (this.axis == EagleSubdivideAxis.TopDown ? "NS" : "EW"),
            "cells": this.SaveCells()
        };
    }

    LoadThis(data: ISavedDataCell) {
        //Add content if there is any
        this.content.Load(data.content);

        //Add cells
        for (var i = 0; i < data.cells.length; i++)
            this.LoadCellChild(data.cells[i]);
    }

    LoadCellChild(data: ISavedDataCell) {
        //Make
        var cell = this.ConstructCell();

        //Configure
        cell.LoadThis(data);

        //Add
        this.cells.push(cell);
    }

    protected SaveCells(): any[] {
        var arr = [];
        for (var i = 0; i < this.cells.length; i++)
            arr.push(this.cells[i].Save());
        return arr;
    }

    CreateCell(): EagleSubdivideContainerBase {
        //Make
        var cell = this.ConstructCell();

        //Add
        this.cells.push(cell);

        //Refresh
        this.Refresh();

        return cell;
    }

    SetSize(width: number, height: number) {
        //Store
        this.width = width;
        this.height = height;

        //Refresh
        this.Refresh();
    }

    SetContent(window: EagleWindow) {
        //If we already have content, error
        if (this.content.IsActive())
            throw Error("Cannot add content. There is already content in this cell!");

        //Make sure we don't have cells
        if (this.cells.length != 0)
            throw Error("Cannot add content. There already exists cells in this container.");

        //Set
        this.content.SetWindow(window);
    }

    InsertCell(cell: EagleSubdivideContainerChild, before: boolean): EagleSubdivideContainerBase {
        //Get index of the cell we're going aroud
        var index = this.cells.indexOf(cell) + (before ? 0 : 1);

        //Create the new cell
        var addedCell = this.ConstructCell();

        //Insert
        this.cells.splice(index, 0, addedCell);

        //Refresh
        this.Refresh();

        return addedCell;
    }

    Refresh() {
        //Apply only if we have cells to avoid divide-by-zero errors
        if (this.cells.length != 0) {
            //Get the total size of the main axis
            var totalSize = this.axis == EagleSubdivideAxis.LeftRight ? this.width : this.height;

            //Remove spacing
            totalSize -= (this.cells.length - 1) * ELEMENT_SPACING;

            //For now, just evenly divide. We'll switch this up later...
            var elementSize = totalSize / this.cells.length;

            //Apply
            var offset = 0;
            for (var i = 0; i < this.cells.length; i++) {
                //Apply offset to child
                this.cells[i].SetOffset(this.ApplyToMainAxisX(0, offset), this.ApplyToMainAxisY(0, offset));

                //Apply size to child
                this.cells[i].SetSize(this.ApplyToMainAxisX(this.width, elementSize), this.ApplyToMainAxisY(this.height, elementSize));

                //Update offset counter
                offset += elementSize;
                offset += ELEMENT_SPACING;
            }
        }

        //If we have content, send events
        if (this.content != null) {
            this.content.SetSize(this.width, this.height);
        }
    }

    //Removes empty cells
    Cleanup() {
        //Check children
        this.CleanupInternal();

        //Refresh
        this.Refresh();
    }

    private CleanupInternal() {
        //Do cleanup
        for (var i = 0; i < this.cells.length; i++) {
            if (this.cells[i].IsEmpty()) {
                this.RemoveAtInternal(i);
            } else {
                this.cells[i].CleanupInternal();
            }
        }

        //Attempt to simplify cells
        for (var i = 0; i < this.cells.length; i++) {
            this.cells[i].Simplify();
        }
    }

    //Removes this
    Remove() {
        //If we have content, throw an error
        if (this.content.IsActive())
            throw Error("Cannot remove. There is still content!");

        //Remove
        this.mount.remove();
    }

    //Checks if this and it's children are empty
    IsEmpty(): boolean {
        //If there's content, stop
        if (this.content.IsActive())
            return false;

        //Check cells
        for (var i = 0; i < this.cells.length; i++) {
            if (!this.cells[i].IsEmpty())
                return false;
        }

        return true;
    }

    // Removes a cell at an index but does NOT cause a refresh.
    protected RemoveAtInternal(i: number) {
        //Let child remove itself
        this.cells[i].Remove();

        //Remove child from list
        this.cells.splice(i, 1);
    }

    //IMPORTANT: Must add and refresh!
    protected ConstructCell(): EagleSubdivideContainerChild {
        //Create a new node
        var childNode = EagleUtil.CreateElement("div", null, this.mount);
        childNode.style.position = "absolute";

        //Get the reverse of the current axis
        var childAxis = this.axis == EagleSubdivideAxis.LeftRight ? EagleSubdivideAxis.TopDown : EagleSubdivideAxis.LeftRight;

        //Create the new cell
        return new EagleSubdivideContainerChild(this, childNode, childAxis, this.manager);
    }

    private ApplyToMainAxisX(x: number, mainAxisChange: number): number {
        if (this.axis == EagleSubdivideAxis.LeftRight) {
            //Set X to the updated value
            return mainAxisChange;
        } else {
            //Keep
            return x;
        }
    }

    private ApplyToMainAxisY(y: number, mainAxisChange: number): number {
        if (this.axis == EagleSubdivideAxis.LeftRight) {
            //Keep
            return y;
        } else {
            //Set X to the updated value
            return mainAxisChange;
        }
    }

    static DirectionToAxis(direction: EagleSubdivideDirection): EagleSubdivideAxis {
        switch (direction) {
            case EagleSubdivideDirection.Top:
            case EagleSubdivideDirection.Bottom:
                return EagleSubdivideAxis.TopDown;
            case EagleSubdivideDirection.Left:
            case EagleSubdivideDirection.Right:
                return EagleSubdivideAxis.LeftRight;
        }
        throw Error("Invalid direction.");
    }

}

class EagleSubdivideWindow implements IEagleWindowContainer {

    constructor(parent: EagleSubdivideContainerBase, container: HTMLElement) {
        this.parent = parent;
        this.node = EagleUtil.CreateElement("div", null, container);
    }

    private parent: EagleSubdivideContainerBase;
    private node: HTMLElement;

    private window: EagleWindow = null;
    private width: number;
    private height: number;

    Save(): any {
        return this.window == null ? null : this.window.Serialize();
    }

    Load(data: any) {
        if (data != null)
            this.SetWindow(this.parent.GetWindowManager().DeserializeWindow(data));
    }

    WindowMadeActive() {

    }

    WindowMadeInactive() {

    }

    GetWindow(): EagleWindow {
        //Sanity check
        if (this.window == null)
            throw Error("Window is not set.");

        return this.window;
    }

    //Same as GetWindow, except it also removes the window (without triggering a refresh)
    CutWindow(): EagleWindow {
        //Get
        var window = this.GetWindow();

        //Remove
        this.window = null;

        return window;
    }

    SetWindow(window: EagleWindow) {
        //Set (it's important that this comes first, as if the old container was also a subdivide window, it would appear empty during the intermediary change)
        this.window = window;

        //Apply
        window.ChangeContainer(this, this.node);

        //Notify
        this.parent.Refresh();

        //Save
        this.parent.GetWindowManager().SaveAll();
    }

    IsActive(): boolean {
        return this.window != null;
    }

    SetSize(width: number, height: number): void {
        //Copy
        this.width = width;
        this.height = height;

        //Apply to DOM
        this.node.style.width = width + "px";
        this.node.style.height = height + "px";

        //Apply to window
        if (this.window != null)
            this.window.SetSize(width, height);
    }

    Detach(): void {
        //Clear
        this.window = null;

        //Notify
        this.parent.Cleanup();
    }

    ShowWindowBorder(): boolean {
        return false;
    }

    WindowMoveRequested(deltaX: number, deltaY: number): void {
        //Popout
        this.window.PopOutWindow(this.width, this.height);
    }

    WindowMoveEnd(): void {

    }

    WindowResizeRequested(deltaX: number, deltaY: number): void {

    }

    WindowResizeEnd(): void {

    }

}

class EagleSubdivideContainerChild extends EagleSubdivideContainerBase {

    constructor(parent: EagleSubdivideContainerBase, mount: HTMLElement, axis: EagleSubdivideAxis, manager: EagleWindowManager) {
        super(mount, axis, manager);
        this.parent = parent;

        //Create control
        this.control = new EagleWindowMountControl(this.mount)
            .AddButton(1, 0, "eagle_mc_btn_n", (window: EagleWindow) => { this.SetContentDirection(EagleSubdivideDirection.Top, window); })
            .AddButton(0, 1, "eagle_mc_btn_w", (window: EagleWindow) => { this.SetContentDirection(EagleSubdivideDirection.Left, window); })
            .AddButton(1, 2, "eagle_mc_btn_s", (window: EagleWindow) => { this.SetContentDirection(EagleSubdivideDirection.Bottom, window); })
            .AddButton(2, 1, "eagle_mc_btn_e", (window: EagleWindow) => { this.SetContentDirection(EagleSubdivideDirection.Right, window); });
    }

    private parent: EagleSubdivideContainerBase;
    private control: EagleWindowMountControl;

    SetOffset(x: number, y: number) {
        //Apply offset
        this.mount.style.left = x + "px";
        this.mount.style.top = y + "px";
    }

    Remove() {
        super.Remove();
    }

    Cleanup() {
        //Escalate to the top level
        this.parent.Cleanup();
    }

    Refresh() {
        //Set DOM size
        this.mount.style.width = this.width + "px";
        this.mount.style.height = this.height + "px";

        //Set control enabled
        this.control.SetEnabled(this.cells.length == 0); //we only want this to appear at the bottom of the chain

        //Run normally
        super.Refresh();
    }

    //Does any simplification and returns the result. This occurs when you have two layers of 1-cell layers. This'll undo the else in SetContentDirection
    Simplify(): boolean {
        //Make sure we can
        if (this.cells.length != 1 || this.cells[0].cells.length != 0 || !this.cells[0].content.IsActive())
            return false;

        //Extract window
        var window = this.cells[0].content.CutWindow();

        //Remove the cell
        this.RemoveAtInternal(0);

        //Relocate content...this will trigger a refresh
        this.SetContent(window);

        return true;
    }

    private SetContentDirection(direction: EagleSubdivideDirection, window: EagleWindow) {
        //Calculate
        var requestAxis = EagleSubdivideContainerBase.DirectionToAxis(direction);
        var requestBefore = direction == EagleSubdivideDirection.Top || direction == EagleSubdivideDirection.Left;

        //If the axis matches our parent, insert a cell there. Otherwise, insert it on us because we'll have the opposite axis
        if (this.parent.GetAxis() == requestAxis) {
            //Insert in parent
            var cell = this.parent.InsertCell(this, requestBefore);

            //Apply
            cell.SetContent(window);
        } else if (this.cells.length == 0 && this.content.IsActive()) {
            //It matches our direction! We're going to create a new cell for the content and rearrange a bit...
            //First, construct the cells
            var cellContent = this.ConstructCell();
            var cellNew = this.ConstructCell();

            //Add to list in the order specified
            if (requestBefore) {
                //Current content comes after new content
                this.cells.push(cellNew);
                this.cells.push(cellContent);
            } else {
                //Current content comes before new content
                this.cells.push(cellContent);
                this.cells.push(cellNew);
            }

            //Set content in the cell
            cellNew.SetContent(window);

            //Relocate content...this will trigger a refresh
            cellContent.SetContent(this.content.GetWindow());
        } else {
            throw new Error("Invalid window state.");
        }
    }

}

export default class EagleDockWindowLayer extends EagleSubdivideContainerBase implements IEagleWindowLayer {

    constructor(mount: HTMLElement, manager: EagleWindowManager) {
        super(mount, EagleSubdivideAxis.TopDown, manager);

        //Create our own control that doesn't have directions on it. It'll only be shown when there's nothing in this view
        this.rootControl = new EagleWindowMountControl(this.mount)
            .AddButton(1, 1, "eagle_mc_btn_new", (window: EagleWindow) => { this.SetContent(window); });

        //Start a timer to look for changing sizes. I don't like this UI thrashing at all, but there's no consistent way to know if we've changed
        this.layoutTimer = setInterval(() => {
            var e = this.mount;
            if (e.clientWidth != this.lastWidth || e.clientHeight != this.lastHeight) {
                //Changed
                this.lastWidth = e.clientWidth;
                this.lastHeight = e.clientHeight;

                //Update
                this.SetSize(this.lastWidth, this.lastHeight);
            }
        }, 500);
    }

    private rootControl: EagleWindowMountControl;

    private layoutTimer: any;
    private lastWidth: number = 0;
    private lastHeight: number = 0;

    Refresh(): void {
        //Make our control active if we're empty
        this.rootControl.SetEnabled(this.IsEmpty());

        //Call main
        super.Refresh();
    }

    SetContent(window: EagleWindow) {
        //Instead of setting the content in the root window, create a cell for it to be stored in
        var cell = this.ConstructCell();
        cell.SetSize(this.width, this.height);
        this.cells.push(cell);
        cell.SetContent(window);
        this.Refresh();
    }

    Save(): any {
        return {
            "version": SAVE_VERSION,
            "width": this.lastWidth,
            "height": this.lastHeight,
            "cells": this.SaveCells()
        };
    }

    Load(data: ISavedData) {
        //Load all cells
        for (var i = 0; i < data.cells.length; i++)
            this.LoadCellChild(data.cells[i]);

        //Refresh
        this.Refresh();
    }

}