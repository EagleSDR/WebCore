import EagleUtil from "../../../../lib/EagleUtil";
import EagleWindowMountControl from "../control/EagleWindowMountControl";
import EagleWindow from "../EagleWindow";
import EagleWindowManager from "../EagleWindowManager";
import { EagleSubdivideAxis } from "./EagleSubdivideAxis";
import { EagleSubdivideAxisSize } from "./EagleSubdivideAxisSize";
import { EagleSubdivideDirection } from "./EagleSubdivideDirection";
import EagleSubdivideWindowWrapper from "./EagleSubdivideWindowWrapper";
import IEagleSubdivideItem from "./IEagleSubdivideItem";
import IEagleSubdivideItemParent from "./IEagleSubdivideItemParent";

const ELEMENT_SPACING: number = 5;

export default class EagleSubdivideContainer implements IEagleSubdivideItem {

    constructor(axis: EagleSubdivideAxis) {
        //Create size
        this.size = new EagleSubdivideAxisSize(axis);

        //Create node
        this.node = EagleUtil.CreateElement("div", null);
        this.node.style.position = "absolute";

        //Make control
        this.control = new EagleWindowMountControl(this.node)
            .AddButton(1, 1, "e", (window: EagleWindow) => { this.CreateCell(new EagleSubdivideWindowWrapper(window)); });
    }

    private parent: IEagleSubdivideItemParent;
    private node: HTMLElement;
    private cells: EagleSubdivideContainerCell[] = [];
    private control: EagleWindowMountControl;

    size: EagleSubdivideAxisSize;

    GetNode(): HTMLElement {
        return this.node;
    }

    GetManager(): EagleWindowManager {
        return this.parent.GetManager();
    }

    SetParent(parent: IEagleSubdivideItemParent): HTMLElement {
        this.parent = parent;
        return this.node;
    }

    Resize(width: number, height: number): void {
        //Set
        this.size.SetLeft(width);
        this.size.SetTop(height);

        //Apply
        this.Refresh();
    }

    GetAxis(): EagleSubdivideAxis {
        return this.size.GetAxis();
    }

    SetAxis(axis: EagleSubdivideAxis) {
        //Sanity check
        if (!this.CanChangeAxis() && axis != this.GetAxis())
            throw Error("Unable to change axis.");

        //Set
        this.size.SetAxis(axis, false);
    }

    CanChangeAxis(): boolean {
        return this.cells.length < 2;
    }

    CreateCell(item: IEagleSubdivideItem) {
        //Create the new cell
        var cell = new EagleSubdivideContainerCell(this, item);

        //Add
        this.cells.push(cell);

        //Refresh
        this.Refresh();
    }

    InsertCell(cell: EagleSubdivideContainerCell, before: boolean, item: IEagleSubdivideItem): EagleSubdivideContainerCell {
        //Get index of the cell we're going aroud
        var index = this.cells.indexOf(cell);

        //Create the new cell
        var addedCell = new EagleSubdivideContainerCell(this, item);

        //Insert
        if (before) {
            this.cells.splice(index, 0, addedCell);
        } else {
            this.cells.splice(index + 1, 0, addedCell);
        }

        //Refresh
        this.Refresh();

        return addedCell;
    }

    InternalRemoveCell(cell: EagleSubdivideContainerCell): void {
        //Get index and remove
        this.cells.splice(this.cells.indexOf(cell), 1);

        //Refresh
        this.Refresh();
    }

    private Refresh() {
        //Set status of the control
        this.control.SetEnabled(this.cells.length == 0);

        //Set DOM size
        this.node.style.width = this.size.GetLeft() + "px";
        this.node.style.height = this.size.GetTop() + "px";

        //If there are no cells, request our removal
        if (this.cells.length == 0) {
            this.parent.RequestRemoval();
        } else {
            //Calculate the total size
            var totalSize = this.size.GetPrimaryAxis();

            //Remove spacing
            totalSize -= (this.cells.length - 1) * ELEMENT_SPACING;

            //For now, just evenly divide. We'll switch this up later...
            var elementSize = totalSize / this.cells.length;

            //Apply
            var offset = 0;
            for (var i = 0; i < this.cells.length; i++) {
                this.cells[i].Update(elementSize, offset);
                offset += elementSize;
                offset += ELEMENT_SPACING;
            }
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

class EagleSubdivideContainerCell implements IEagleSubdivideItemParent {

    constructor(container: EagleSubdivideContainer, item: IEagleSubdivideItem) {
        this.container = container;
        this.item = item;

        //Create the main node
        this.node = EagleUtil.CreateElement("div", null, this.container.GetNode());
        this.node.style.position = "absolute";
        this.node.appendChild(this.item.SetParent(this));

        //Make control
        this.control = new EagleWindowMountControl(this.node)
            .AddButton(1, 0, "e", (window: EagleWindow) => { this.AddItemView(EagleSubdivideDirection.Top, window); })
            .AddButton(0, 1, "e", (window: EagleWindow) => { this.AddItemView(EagleSubdivideDirection.Left, window); })
            .AddButton(1, 2, "e", (window: EagleWindow) => { this.AddItemView(EagleSubdivideDirection.Bottom, window); })
            .AddButton(2, 1, "e", (window: EagleWindow) => { this.AddItemView(EagleSubdivideDirection.Right, window); });
    }

    private container: EagleSubdivideContainer;
    private item: IEagleSubdivideItem;
    private node: HTMLElement;
    private size: EagleSubdivideAxisSize;
    private control: EagleWindowMountControl;

    RequestRemoval(): void {
        //Remove container
        this.node.remove();

        //Signal
        this.container.InternalRemoveCell(this);
    }

    GetManager(): EagleWindowManager {
        return this.container.GetManager();
    }

    Update(sizePx: number, offsetPx: number): void {
        //Calculate size
        this.size = this.container.size.Clone();
        this.size.SetPrimaryAxis(sizePx);

        //Calculate position
        var pos = new EagleSubdivideAxisSize(this.container.GetAxis());
        pos.SetPrimaryAxis(offsetPx);

        //Apply to HTML node
        this.node.style.width = this.size.GetLeft() + "px";
        this.node.style.height = this.size.GetTop() + "px";
        this.node.style.left = pos.GetLeft() + "px";
        this.node.style.top = pos.GetTop() + "px";

        //Apply to item
        this.item.Resize(this.size.GetLeft(), this.size.GetTop());
    }

    AddItem(direction: EagleSubdivideDirection, item: IEagleSubdivideItem): void {
        //Calculate
        var requestAxis = EagleSubdivideContainer.DirectionToAxis(direction);
        var requestBefore = direction == EagleSubdivideDirection.Top || direction == EagleSubdivideDirection.Left;

        //Switch depending on if the axis matches the container (or it's still flexible)
        if (this.container.GetAxis() == requestAxis || this.container.CanChangeAxis()) {
            //We can simply add it as a cell
            this.container.SetAxis(requestAxis);
            this.container.InsertCell(this, requestBefore, item);
        } else {
            //Different direction! We'll need to change our item into it's own container
            var sub = new EagleSubdivideContainer(requestAxis);

            //Add items
            if (requestBefore) {
                //Insert new item first
                sub.CreateCell(item);
                sub.CreateCell(this.item);
            } else {
                //Insert existing item first
                sub.CreateCell(this.item);
                sub.CreateCell(item);
            }

            //Replace
            this.item = sub;
            this.node.appendChild(sub.SetParent(this));
            sub.Resize(this.size.GetLeft(), this.size.GetTop());
        }
    }

    private AddItemView(direction: EagleSubdivideDirection, window: EagleWindow) {
        this.AddItem(direction, new EagleSubdivideWindowWrapper(window));
    }

}