import EagleUtil from "../../../../lib/EagleUtil";
import EagleSortedDom from "../../../core/misc/EagleSortedDom";
import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowRegistration from "../IEagleWindowRegistration";
import IEagleWindowFactoryItem from "./IEagleWindowFactoryItem";
require("./factory.css");

export default abstract class EagleWindowFactoryBar extends EagleSortedDom<BarGroup> {

    constructor(manager: EagleWindowManager) {
        super();
        this.manager = manager;
    }

    private manager: EagleWindowManager;
    private groups: BarGroup[] = [];

    private GetOrCreateGroupIndex(name: string): number {
        //Find
        for (var i = 0; i < this.groups.length; i++) {
            if (this.groups[i].GetName().toLowerCase() == name.toLowerCase())
                return i;
        }

        //Create
        var g = new BarGroup(name);
        this.AddDomItem(g.GetNode(), g);
        this.groups.push(g);

        return this.groups.length - 1;
    }

    AddItem(item: IEagleWindowFactoryItem) {
        //Create the item
        var bItem = new BarItem(this.manager, item);

        //Get group
        var groupIndex = this.GetOrCreateGroupIndex(item.GetGroupName());

        //Add to group
        this.groups[groupIndex].AddItem(bItem);
    }

    RemoveItem(item: IEagleWindowFactoryItem): boolean {
        //Search for group
        var groupIndex = this.GetOrCreateGroupIndex(item.GetGroupName());
        var group = this.groups[groupIndex];

        //Remove
        var success = group.RemoveItem(item);

        //Check if the group is empty. If it is, remove it
        if (group.IsEmpty()) {
            this.RemoveDomItem(group);
            this.groups.splice(groupIndex, 1);
        }

        return success;
    }

    protected Compare(a: BarGroup, b: BarGroup): number {
        return a.GetName().toLowerCase().localeCompare(b.GetName().toLowerCase());
    }

}

class BarGroup extends EagleSortedDom<BarItem> {

    constructor(name: string) {
        super();
        this.node = EagleUtil.CreateElement("div", null);
        this.name = name;

        //Create title bar
        var titleBar = EagleUtil.CreateElement("div", "eagle_window_bar_divider", this.node);
        EagleUtil.CreateElement("div", "eagle_window_bar_divider_text", titleBar).innerText = name;
        EagleUtil.CreateElement("div", "eagle_window_bar_divider_line", titleBar);
    }

    private node: HTMLElement;
    private name: string;
    private items: BarItem[] = [];

    GetNode(): HTMLElement {
        return this.node;
    }

    GetName(): string {
        return this.name;
    }

    AddItem(item: BarItem) {
        //Add to items
        this.items.push(item);

        //Add to DOM items
        this.AddDomItem(item.GetNode(), item);
    }

    RemoveItem(item: IEagleWindowFactoryItem): boolean {
        //Find the wrapped item
        for (var i = 0; i < this.items.length; i++) {
            if (this.items[i].GetRegistration() == item) {
                //Remove from DOM
                this.RemoveDomItem(this.items[i]);

                //Remove from list
                this.items.splice(i, 1);

                return true;
            }
        }

        //Not found
        return false;
    }

    IsEmpty(): boolean {
        return this.GetDomItemCount() == 0;
    }

    protected GetMount(): HTMLElement {
        return this.node;
    }

    protected Compare(a: BarItem, b: BarItem): number {
        return a.GetRegistration().GetDisplayName().toLowerCase().localeCompare(b.GetRegistration().GetDisplayName().toLowerCase());
    }

}

class BarItem {

    constructor(manager: EagleWindowManager, reg: IEagleWindowFactoryItem) {
        //Set
        this.manager = manager;
        this.reg = reg;

        //Create item
        this.view = EagleUtil.CreateElement("div", "eagle_window_bar_item");
        this.preview = EagleUtil.CreateElement("div", "eagle_window_bar_item_preview", this.view);
        this.label = EagleUtil.CreateElement("div", "eagle_window_bar_item_label", this.view);

        //Set content
        this.preview.appendChild(reg.GetPreview());
        this.label.innerText = reg.GetDisplayName();

        //Add events
        var mouseMoveEvent = (evt: MouseEvent) => {
            this.manager.CreateWindowClassDragging(this.reg.GetRegistration(), this.reg.GetSettings(), 300, 200, evt);
            evt.preventDefault();
            evt.stopPropagation();
        }
        this.view.addEventListener("mousedown", (evt: MouseEvent) => {
            window.addEventListener("mousemove", mouseMoveEvent, {
                once: true
            });
        });
        window.addEventListener("mouseup", (evt: MouseEvent) => {
            window.removeEventListener("mousemove", mouseMoveEvent);
        });
    }

    private manager: EagleWindowManager;
    private reg: IEagleWindowFactoryItem;

    private view: HTMLElement;
    private label: HTMLElement;
    private preview: HTMLElement;

    GetNode(): HTMLElement {
        return this.view;
    }

    GetRegistration(): IEagleWindowFactoryItem {
        return this.reg;
    }

    Remove() {
        this.view.remove();
    }

}