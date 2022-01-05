import EagleWindowManager from "../EagleWindowManager";
import IEagleWindowLayer from "../IEagleWindowLayer";
import { EagleSubdivideAxis } from "../subdivide/EagleSubdivideAxis";
import EagleSubdivideContainer from "../subdivide/EagleSubdivideContainer";
import IEagleSubdivideItem from "../subdivide/IEagleSubdivideItem";
import IEagleSubdivideItemParent from "../subdivide/IEagleSubdivideItemParent";

export default class EagleSubdivideWindowLayer implements IEagleSubdivideItemParent {

    constructor(layer: IEagleWindowLayer) {
        this.layer = layer;

        //Create container
        this.container = new EagleSubdivideContainer(EagleSubdivideAxis.TopDown);

        //Set parent
        this.layer.GetMount().appendChild(this.container.SetParent(this));

        //Start a timer to look for changing sizes. I don't like this UI thrashing at all, but there's no consistent way to know if we've changed
        this.layoutTimer = setInterval(() => {
            var e = this.layer.GetMount();
            if (e.clientWidth != this.lastWidth || e.clientHeight != this.lastHeight) {
                //Changed
                this.lastWidth = e.clientWidth;
                this.lastHeight = e.clientHeight;

                //Update
                this.container.Resize(this.lastWidth, this.lastHeight);
            }
        }, 500);
    }

    private layer: IEagleWindowLayer;
    private container: EagleSubdivideContainer;

    private layoutTimer: any;
    private lastWidth: number = 0;
    private lastHeight: number = 0;

    CreateCell(item: IEagleSubdivideItem) {
        this.container.CreateCell(item);
    }

    GetManager(): EagleWindowManager {
        return this.layer.GetWindowManager();
    }

    RequestRemoval(): void {
        //Do nothing
    }

}