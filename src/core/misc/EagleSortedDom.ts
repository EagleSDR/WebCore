// Sorts DOM content
export default abstract class EagleSortedDom<T> {

    constructor() {

    }

    private sortedItems: ISortedItem<T>[] = [];

    // Gets the container for the sorted DOM. Should be empty.
    protected abstract GetMount(): HTMLElement;

    // Compares two items.
    protected abstract Compare(a: T, b: T): number;

    // Returns the number of stored items.
    protected GetDomItemCount(): number {
        return this.sortedItems.length;
    }

    // Add an item to the DOM
    protected AddDomItem(node: HTMLElement, item: T): void {
        //Wrap in item
        var sItem: ISortedItem<T> = {
            node: node,
            item: item
        };

        //Find where to place it
        for (var i = 0; i < this.sortedItems.length; i++) {
            if (this.Compare(this.sortedItems[i].item, item) <= 0) {
                //Place before this item
                this.GetMount().insertBefore(node, this.sortedItems[i].node);
                this.sortedItems.splice(i, 0, sItem);
                return;
            }
        }

        //Place at end
        this.GetMount().appendChild(node);
        this.sortedItems.push(sItem);
    }

    // Removes an item from the DOM
    protected RemoveDomItem(item: T): void {
        //Find in the list
        for (var i = 0; i < this.sortedItems.length; i++) {
            if (this.sortedItems[i].item == item) {
                //Remove both from the DOM and from the list
                this.GetMount().removeChild(this.sortedItems[i].node);
                this.sortedItems.splice(i, 1);
                return;
            }
        }

        //Not found!
        throw Error("Item wasn't found in the DOM.");
    }

}

interface ISortedItem<T> {

    node: HTMLElement;
    item: T;

}