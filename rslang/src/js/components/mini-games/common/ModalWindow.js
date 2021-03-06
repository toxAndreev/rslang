import create from '../../../utils/сreate';
import {
  modalConstants,
} from '../../../constants/constants';

const {
  MODAL_TITLE,
  MODAL_WARNING,
  CLOSE_BUTTON,
  CANCEL_BUTTON,
} = modalConstants;

export default class ModalWindow {
  constructor(modalId = 'rslang_modal') {
    this.body = document.querySelector('body');

    const modal = document.querySelector(`#${modalId}`);
    if (modal) {
      this.modal = modal;
      this.modalText = this.modal.querySelector('.modal_text');
      this.modalTitle = this.modal.querySelector('.modal_title');
      this.modalWarning = this.modal.querySelector('.modal_warning');
      this.modalClose = this.modal.querySelector('.close_button');
      this.modalCancel = this.modal.querySelector('.cancel_button');
    } else {
      this.modal = create('div', 'modal', '', this.body, ['id', modalId]);
      this.modalText = create('div', 'modal_text', '', this.modal);
      this.modalTitle = create('h4', 'modal_title', MODAL_TITLE, this.modalText);
      this.modalWarning = create('p', 'modal_warning', MODAL_WARNING, this.modalText);
      this.modalClose = create('button', 'modal_button close_button', CLOSE_BUTTON, this.modalText);
      this.modalCancel = create('button', 'modal_button cancel_button', CANCEL_BUTTON, this.modalText);
    }
    this.modalClose.addEventListener('click', (this.closeButtonHandler).bind(this));
    this.modalCancel.addEventListener('click', (this.cancelButtonHandler).bind(this));
  }

  show() {
    ModalWindow.changeDisplay(this.modal, 'block');
  }

  hide(callbackFn) {
    ModalWindow.changeDisplay(this.modal, 'none');
    if (typeof callbackFn === 'function') {
      callbackFn();
    }
  }

  closeButtonHandler() {
    this.hide();
    if (this.CallbackFnOnClose) {
      this.CallbackFnOnClose();
    }
  }

  cancelButtonHandler() {
    this.hide();
    if (this.CallbackFnOnCancel) {
      this.CallbackFnOnCancel();
    }
  }

  addCallbackFnOnClose(callbackFn) {
    if (typeof callbackFn === 'function') {
      this.CallbackFnOnClose = callbackFn;
    }
  }

  addCallbackFnOnCancel(callbackFn) {
    if (typeof callbackFn === 'function') {
      this.CallbackFnOnCancel = callbackFn;
    }
  }

  removeEvents() {
    this.CallbackFnOnClose = null;
    this.CallbackFnOnCancel = null;
  }

  static changeDisplay(element, event) {
    const el = element;
    if (event === 'none') {
      el.style.display = 'none';
    } else {
      el.style.display = 'block';
    }
  }
}
