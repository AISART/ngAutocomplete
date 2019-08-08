import {
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {IsMobileOrTablet} from '../utils/utils';

@Directive({
    selector: '[ngDropdown]'
})
export class NgDropdownDirective implements OnChanges, OnInit, OnDestroy {
    @Input() public list: any[] = [];
    @Input() public active: any = null;

    @Input() public input: HTMLElement = null;
    @Input() public element: Element = null;

    @Input() public key: string = '';
    @Input() public completion: boolean = true;

    @Output() public hover: EventEmitter<any> = new EventEmitter<any>();
    @Output() public selected: EventEmitter<any> = new EventEmitter<any>();
    @Output() public closed: EventEmitter<any> = new EventEmitter<any>();

    _open: boolean = false;
    _list: { active: boolean, [value: string]: any }[] = [];
    _class: string = '';

    constructor(public _eref: ElementRef) {
    }

    /**
     *
     */
    ngOnInit() {
        this._class = `dr-item-${this.key}-`;

        if (!IsMobileOrTablet()) {
            this._eref.nativeElement.addEventListener('mouseover', this.mouseoverListenerBind);
        }

        /**
         *
         */
        this.PrepareList();
    }

    /**
     *
     */
    ngOnChanges(changes: SimpleChanges) {
        if (typeof changes['active'] !== 'undefined' && !changes['active'].firstChange) {
            this.PrepareList();
        }
        if (typeof changes['list'] !== 'undefined') {
            this.list = changes['list'].currentValue;

            /**
             *
             */
            this.PrepareList();
        }
    }

    /**
     *
     */
    keyDown(event: KeyboardEvent) {
        event.stopImmediatePropagation();
        event.stopPropagation();

        /**
         *
         */
        switch (event.code) {
            case 'ArrowDown':
                this.Open();

                /**
                 *
                 */
                this.SetActive(this.FindActive() + 1);
                this.DropdownFocusAreaDown();

                event.preventDefault();
                break;
            case 'ArrowUp':
                this.Open();

                /**
                 *
                 */
                this.SetActive(this.FindActive() - 1);
                this.DropdownFocusAreaUp();

                event.preventDefault();
                break;
            case 'Enter':
                this.EmitSelected();
                this.Close(null, true);

                if (this.RefExists()) {
                    this.input.blur();
                }

                event.preventDefault();
                break;
            case 'Escape':
                this.Close(null, true);

                if (this.RefExists()) {
                    this.input.blur();
                }

                event.preventDefault();
                break;
            case 'Tab':
                if (!event.shiftKey) {
                    this.EmitSelected();
                }

                this.Close(null, true);
                break;
            default:
                return;
        }
    }

    /**
     *
     */
    OnMouseOver(event: MouseEvent) {
        // Mouse didn't actually move, so no logic needed.
        if (event.movementX == 0 && event.movementY == 0) {
            return
        }

        /**
         *
         */
        const el: any = event.target || event.srcElement;
        if (el.id.length > 0 && el.id.includes(this._class)) {
            this.SetActive(Number(el.id.slice(this._class.length, el.id.length)));
        }
    }

    /**
     *
     */
    EmitSelected() {
        if (this.FindActive() > -1) {
            this.selected.emit(this._list[this.FindActive()].key);
        }
    }

    /**
     *
     */
    DropdownFocusAreaDown() {
        let scroll = this._eref.nativeElement.offsetHeight + this._eref.nativeElement.scrollTop;

        /**
         *
         */
        if ((this.GetElement(this.FindActive()).offsetTop + this.GetElement(this.FindActive()).offsetHeight) > scroll) {
            this._eref.nativeElement.scrollTop = this.GetElement(this.FindActive()).offsetTop - (this._eref.nativeElement.offsetHeight - this.GetElement(this.FindActive()).offsetHeight)
        }
    }

    /**
     *
     */
    DropdownFocusAreaUp() {
        let scroll = this._eref.nativeElement.scrollTop;

        /**
         *
         */
        if (this.GetElement(this.FindActive()).offsetTop < scroll && scroll > 0) {
            this._eref.nativeElement.scrollTop = this.GetElement(this.FindActive()).offsetTop;
        }
    }

    // =======================================================================//
    // ! Bindings                                                             //
    // =======================================================================//

    /**
     *
     */
    @HostBinding('class.open')
    get opened() {
        return this._open;
    }


    // =======================================================================//
    // ! Listeners                                                            //
    // =======================================================================//

    /**
     *
     */
    @HostListener('document:click', ['$event'])
    Close(event, force: boolean = false) {
        if (!this._open) {
            return;
        }

        const close = () => {
            this._open = false;

            /**
             * Emit NULL so listening components know what to do.
             */
            this.RemoveListeners();
            this.ClearActive();
            this.hover.emit(null);
            this.closed.emit();
        };

        if (force) {
            close();
            return;
        }

        if ((this._open && (!this.element.contains(event.target)))) {
            close();
        }
    }

    /**
     *
     */
    private inputKeydown(event: KeyboardEvent) {
        this.keyDown(event);
    }

    private inputKeydownBind = this.inputKeydown.bind(this);

    /**
     *
     */
    private documentKeydown(event: KeyboardEvent) {
        this.keyDown(event);
    }

    private documentKeydownBind = this.documentKeydown.bind(this);

    /**
     *
     */
    private mouseoverListener(event: MouseEvent) {
        this.OnMouseOver(event);
    }

    private mouseoverListenerBind = this.mouseoverListener.bind(this);

    // =======================================================================//
    // ! Utils                                                                //
    // =======================================================================//

    /**
     *
     */
    RegisterListeners() {
        if (this.RefExists()) {
            this.input.addEventListener('keydown', this.inputKeydownBind);
        }

        if (!this.completion) {
            document.addEventListener('keydown', this.documentKeydownBind);
        }
    }

    /**
     *
     */
    RemoveListeners() {
        if (this.RefExists()) {
            this.input.removeEventListener('keydown', this.inputKeydownBind);
        }

        if (!this.completion) {
            document.removeEventListener('keydown', this.documentKeydownBind);
        }

        if (!IsMobileOrTablet()) {
            this._eref.nativeElement.removeEventListener('mouseover', this.mouseoverListenerBind);
        }
    }

    /**
     *
     */
    Open() {
        setTimeout(() => {
            if (!this._open && !this._eref.nativeElement.classList.contains('is-initial-empty')) {
                this.RegisterListeners();

                this._open = true;
                this.PrepareList();

                /**
                 *
                 */
                if (this.FindActive() < 0) {
                    this._eref.nativeElement.scrollTop = 0;
                } else {
                    this._eref.nativeElement.scrollTop = this.GetElement(this.FindActive()).offsetHeight * this.FindActive();
                }
            }
        }, 0);
    }

    /**
     *
     */
    RefExists() {
        return typeof this.input !== 'undefined';
    }

    /**
     *
     */
    FindActive(): number {
        return this._list.reduce((result, item, index) => {
            if (item.active) {
                result = index;
            }

            return result;
        }, -1);
    }

    /**
     *
     */
    SetActive(index: number) {
        if (index > this._list.length - 1 || index < 0) return;

        /**
         *
         */
        this.ClearActive();

        this._list[index].active = true;
        this.hover.emit(this._list[index].key);
        /**
         *
         */
        this.GetElement(index).classList.add('active');
    }

    /**
     *
     */
    GetElement(index: number) {
        return this._eref.nativeElement.children[index];
    }

    /**
     *
     */
    ClearActive(): void {
        this._list.forEach((item, index) => {
            item.active = false;

            /**
             *
             */
            this.GetElement(index).classList.remove('active');
        });
    }

    /**
     *
     */
    PrepareList() {
        this._list = Object.keys(this.list).map((key) => {
            return {
                key,
                active: this.ActiveItem(key)
            }
        });

        /**
         *
         */
        this.PrepareChildrenList();
    }

    /**
     *
     */
    ActiveItem(item: any) {
        return this.active !== null && item === this.active;
    }

    /**
     *
     */
    DetermineActiveClass() {
        this._list.forEach((item, index) => {
            if (typeof this.GetElement(index) === 'undefined') {
                return;
            }

            /**
             *
             */
            this.GetElement(index).classList.remove('active');
            if (item.active)
                this.GetElement(index).classList.add('active');
        })

    }

    /**
     *
     */
    PrepareChildrenList() {
        const list = this._eref.nativeElement.children;

        setTimeout(() => {
            for (let i = 0; i < list.length; i++) {
                list[i].id = this._class + i;
            }
        }, 0);

        /**
         *
         */
        this.DetermineActiveClass();

    };

    /**
     *
     */
    DeReference(object: { active: boolean, [value: string]: any }) {
        const {item} = object;

        /**
         *
         */
        return Object.assign({}, {...item});
    }

    /**
     *
     */
    ngOnDestroy() {
        this.RemoveListeners();
    }
}
