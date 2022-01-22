import EagleEventDispatcher from "../../../../../lib/EagleEventDispatcher";
import EagleUtil from "../../../../../lib/EagleUtil";
import IEaglePluginAsset from "../../../../../lib/plugin/IEaglePluginAsset";
import IEagleDialogList from "../../../../../lib/ui/dialog/list/IEagleDialogList";
require("./list.css");

export default class EagleDialogComponentList implements IEagleDialogList {

    constructor(container: HTMLElement) {
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_component_list", container);
    }

    private node: HTMLElement;
    private loadingTimeout: any;
    private selected: ListItem;
    private priorityTable: ListItem[] = []; //Sorted list of priorities, in order, matching how they're placed in DOM

    OnSelectionChanged: EagleEventDispatcher<any> = new EagleEventDispatcher();

    // Gets the value of the currently selected item
    GetSelectedValue(): any {
        if (this.selected == null)
            return null;
        else
            return this.selected.GetValue();
    }

    // Makes the list show a loading symbol
    StartLoading(): void {
        this.node.classList.add("eagle_dialog_component_list_loading");
    }

    // Makes the list show a loading symbol. If StopLoading is not called within timeout, it'll automatically be called
    StartLoadingTimeout(timeoutMs: number): void {
        //Call normally
        this.StartLoading();

        //Set
        this.loadingTimeout = setTimeout(() => this.StopLoading(), timeoutMs);
    }

    // Hides the loading symbol
    StopLoading(): void {
        //Cancel loading timeout, if any
        if (this.loadingTimeout != null) {
            clearTimeout(this.loadingTimeout);
            this.loadingTimeout = null;
        }

        //Stop
        this.node.classList.remove("eagle_dialog_component_list_loading");
    }

    AddItemAsset(priority: number, text: string, subtext: string, icon: IEaglePluginAsset, value: any): void {
        //Create
        var e = new ListItem(priority, text, subtext, value, (c: ListItem) => this.ItemSelected(c));
        e.GetNode().style.backgroundImage = "url(" + icon.GetUrl() + ")";

        //Place in the list
        this.PlaceInList(e);
    }

    AddItemClass(priority: number, text: string, subtext: string, iconClass: string, value: any): void {
        //Create
        var e = new ListItem(priority, text, subtext, value, (c: ListItem) => this.ItemSelected(c));
        e.GetNode().classList.add(iconClass);

        //Place in the list
        this.PlaceInList(e);
    }

    private PlaceInList(item: ListItem) {
        //Find where to place it
        for (var i = 0; i < this.priorityTable.length; i++) {
            //Compare to priority
            if (item.GetPriority() < this.priorityTable[i].GetPriority()) {
                //Goes before this item
                this.node.insertBefore(item.GetNode(), this.priorityTable[i].GetNode());
                this.priorityTable.splice(i, 0, item);
                return;
            }
        }

        //Place at end
        this.node.appendChild(item.GetNode());
        this.priorityTable.push(item);
    }

    private ItemSelected(item: ListItem) {
        //Deselect old
        if (this.selected != null)
            this.selected.SetSelected(false);

        //Set
        this.selected = item;

        //Select this
        if (this.selected != null)
            this.selected.SetSelected(true);

        //Send event
        this.OnSelectionChanged.Send(this.GetSelectedValue());
    }
}

class ListItem {

    constructor(priority: number, text: string, subtext: string, value: any, onSelected: (item: ListItem) => void) {
        this.priority = priority;
        this.value = value;

        //Create
        this.node = EagleUtil.CreateElement("div", "eagle_dialog_component_list_item");
        EagleUtil.CreateElement("div", "eagle_dialog_component_list_item_title", this.node).innerText = text;
        EagleUtil.CreateElement("div", "eagle_dialog_component_list_item_sub", this.node).innerText = subtext;

        //Add event
        this.node.addEventListener("click", (evt: MouseEvent) => {
            onSelected(this);
            evt.preventDefault();
        });
    }

    private node: HTMLElement;
    private priority: number;
    private value: any;

    GetPriority(): number {
        return this.priority;
    }

    GetValue(): any {
        return this.value;
    }

    GetNode(): HTMLElement {
        return this.node;
    }

    SetSelected(selected: boolean) {
        if (selected)
            this.node.classList.add("eagle_dialog_component_list_item_selected");
        else
            this.node.classList.remove("eagle_dialog_component_list_item_selected");
    }

}