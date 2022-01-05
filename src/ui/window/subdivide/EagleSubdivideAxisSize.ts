import { EagleSubdivideAxis } from "./EagleSubdivideAxis";

export class EagleSubdivideAxisSize {

    constructor(axis: EagleSubdivideAxis) {
        this.axis = axis;
    }

    private left: number = 0;
    private top: number = 0;
    private axis: EagleSubdivideAxis;

    Clone(): EagleSubdivideAxisSize {
        var e = new EagleSubdivideAxisSize(this.axis);
        e.SetLeft(this.left);
        e.SetTop(this.top);
        return e;
    }

    GetAxis(): EagleSubdivideAxis {
        return this.axis;
    }

    SetAxis(value: EagleSubdivideAxis, doFlip: boolean) {
        if (doFlip && this.axis != value) {
            //Swap to maintain sizes when dealing with axis
            var temp = this.left;
            this.left = this.top;
            this.top = temp;
        }
        this.axis = value;
    }

    GetLeft(): number {
        return this.left;
    }

    SetLeft(value: number): void {
        this.left = value;
    }

    GetTop(): number {
        return this.top;
    }

    SetTop(value: number) {
        this.top = value;
    }

    GetPrimaryAxis(): number {
        switch (this.axis) {
            case EagleSubdivideAxis.LeftRight: return this.GetLeft();
            case EagleSubdivideAxis.TopDown: return this.GetTop();
        }
    }

    SetPrimaryAxis(value: number): void {
        switch (this.axis) {
            case EagleSubdivideAxis.LeftRight: this.SetLeft(value); return;
            case EagleSubdivideAxis.TopDown: this.SetTop(value); return;
        }
    }

    GetSecondaryAxis(): number {
        switch (this.axis) {
            case EagleSubdivideAxis.TopDown: return this.GetLeft();
            case EagleSubdivideAxis.LeftRight: return this.GetTop();
        }
    }

    SetSecondaryAxis(value: number): void {
        switch (this.axis) {
            case EagleSubdivideAxis.TopDown: this.SetLeft(value); return;
            case EagleSubdivideAxis.LeftRight: this.SetTop(value); return;
        }
    }

}