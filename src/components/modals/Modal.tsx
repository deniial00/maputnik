import React, { type PropsWithChildren } from "react";
import {MdClose} from "react-icons/md";
import AriaModal from "react-aria-modal";
import { EditorScopeContext } from "../../editor/environment";
import classnames from "classnames";
import { type WithTranslation, withTranslation } from "react-i18next";

const EmbeddedAriaModal = AriaModal.renderTo(".maputnik-editor__modals");

type ModalInternalProps = PropsWithChildren & {
  "data-wd-key"?: string
  isOpen: boolean
  title: string
  onOpenToggle(): void
  underlayClickExits?: boolean
  className?: string
} & WithTranslation;


class ModalInternal extends React.Component<ModalInternalProps> {
  static contextType = EditorScopeContext;
  declare context: React.ContextType<typeof EditorScopeContext>;
  private closeTimer?: ReturnType<typeof setTimeout>;

  componentWillUnmount() {
    clearTimeout(this.closeTimer);
  }

  static defaultProps = {
    underlayClickExits: true
  };

  // See <https://github.com/maplibre/maputnik/issues/416>
  onClose = () => {
    if (document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }

    this.closeTimer = setTimeout(() => {
      this.props.onOpenToggle();
    }, 0);
  };

  render() {
    const t = this.props.t;
    const Dialog = this.context ? EmbeddedAriaModal : AriaModal;
    if(this.props.isOpen) {
      return <Dialog
        scrollDisabled={!this.context}
        underlayStyle={this.context ? {position: "absolute"} : undefined}
        dialogStyle={this.context ? {maxHeight: "100%"} : undefined}
        titleText={this.props.title}
        underlayClickExits={this.props.underlayClickExits}
        data-wd-key={this.props["data-wd-key"]}
        verticallyCenter={true}
        onExit={this.onClose}
        dialogClass='maputnik-modal-container'
      >
        <div className={classnames("maputnik-modal", this.props.className)}
          data-wd-key={this.props["data-wd-key"]}
        >
          <header className="maputnik-modal-header">
            <h1 className="maputnik-modal-header-title">{this.props.title}</h1>
            <span className="maputnik-space"></span>
            <button className="maputnik-modal-header-toggle"
              title={t("Close modal")}
              onClick={this.onClose}
              data-wd-key={this.props["data-wd-key"]+".close-modal"}
            >
              <MdClose />
            </button>
          </header>
          <div className="maputnik-modal-scroller">
            <div className="maputnik-modal-content">{this.props.children}</div>
          </div>
        </div>
      </Dialog>;
    }
    else {
      return false;
    }
  }
}

export const Modal = withTranslation()(ModalInternal);
