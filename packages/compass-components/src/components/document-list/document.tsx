import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import type {
  default as HadronDocumentType,
  Element as HadronElementType,
  Editor as EditorType,
} from 'hadron-document';
import { ElementEvents, ElementEditor } from 'hadron-document';
import DocumentActionsGroup from './document-actions-group';
import DocumentFieldsToggleGroup from './document-fields-toggle-group';
import BSONValue from '../bson-value';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { Button } from '../leafygreen';
import { KeyEditor, ValueEditor, TypeEditor } from './element-editors';
import {
  FocusState,
  useFocusState,
  useHoverState,
} from '../../hooks/use-focus-hover';
import { mergeProps } from '../../utils/merge-props';
import { EditActions, AddFieldActions } from './element-actions';

function useForceUpdate() {
  const [, setState] = useState({});
  const forceUpdate = useCallback(() => {
    setState({});
  }, []);
  return forceUpdate;
}

function getEditorByType(type: HadronElementType['type']) {
  switch (type) {
    case 'Date':
    case 'String':
    case 'Decimal128':
    case 'Double':
    case 'Int32':
    case 'Int64':
    case 'Null':
    case 'Undefined':
    case 'ObjectId':
      return ElementEditor[`${type}Editor` as const];
    default:
      return ElementEditor.StandardEditor;
  }
}

function useElementEditor(el: HadronElementType) {
  const editor = useRef<EditorType | null>(null);

  if (!editor.current) {
    const Editor = getEditorByType(el.currentType);
    editor.current = new Editor(el);
  }

  useEffect(() => {
    if (
      editor.current?.element.uuid !== el.uuid ||
      editor.current?.element.currentType !== el.currentType
    ) {
      const Editor = getEditorByType(el.currentType);
      editor.current = new Editor(el);
    }
  }, [el, el.uuid, el.currentType]);

  return editor.current;
}

function useHadronElement(el: HadronElementType) {
  const forceUpdate = useForceUpdate();
  const editor = useElementEditor(el);

  const onElementChanged = useCallback(() => {
    forceUpdate();
  }, [forceUpdate]);

  useEffect(() => {
    el.on(ElementEvents.Added, onElementChanged);
    el.on(ElementEvents.Converted, onElementChanged);
    el.on(ElementEvents.Edited, onElementChanged);
    el.on(ElementEvents.Removed, onElementChanged);
    el.on(ElementEvents.Reverted, onElementChanged);
    el.on(ElementEvents.Invalid, onElementChanged);

    return () => {
      el.off(ElementEvents.Added, onElementChanged);
      el.off(ElementEvents.Converted, onElementChanged);
      el.off(ElementEvents.Edited, onElementChanged);
      el.off(ElementEvents.Removed, onElementChanged);
      el.off(ElementEvents.Reverted, onElementChanged);
      el.off(ElementEvents.Invalid, onElementChanged);
    };
  }, [el, onElementChanged]);

  return {
    id: el.uuid,
    key: {
      value: el.currentKey,
      change(newVal: string) {
        el.rename(newVal);
      },
      // TODO: isKeyEditable should probably account for Array on it's own, but
      // right now `isValueEditable` has a weird dependency on it and so marking
      // aray keys uneditable breaks value editing
      editable: el.isKeyEditable() && el.parent.type !== 'Array',
      valid: el.isDuplicateKey(el.currentKey),
    },
    value: {
      value: editor.value(),
      originalValue: el.currentValue,
      change(newVal: string) {
        editor.edit(newVal);
      },
      editable:
        el.isValueEditable() && el.type !== 'Object' && el.type !== 'Array',
      valid: el.isCurrentTypeValid(),
    },
    type: {
      value: el.currentType,
      change(newVal: HadronElementType['type']) {
        el.changeType(newVal);
      },
    },
    revert: el.isRevertable() ? el.revert.bind(el) : null,
    remove: el.isNotActionable() ? null : el.remove.bind(el),
    expandable: Boolean(el.elements),
    children: el.elements ? [...el.elements] : [],
    level: el.level,
    parentType: el.parent.type,
    isPlaceholder: el.isBlank(),
  };
}

const FA_ICONS = {
  remove: 'times-circle',
  revert: 'rotate-left',
  collapsed: 'angle-right',
  expanded: 'angle-right  fa-rotate-90',
  addChild: 'level-down fa-rotate-90',
  addSibling: 'plus-square-o',
};

export const buttonReset = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
});

const faIcon = css({
  width: spacing[3],
  height: spacing[3],
  padding: '2px',
  textAlign: 'center',
});

export const FAIcon: React.FunctionComponent<{
  icon: keyof typeof FA_ICONS;
}> = ({ icon }) => {
  const faClassName = FA_ICONS[icon];
  return (
    <span
      role="presentation"
      className={cx(faIcon, `fa fa-${faClassName}`)}
    ></span>
  );
};

const hadronElement = css({
  display: 'flex',
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
  '&:hover': {
    backgroundColor: uiColors.gray.light2,
  },
});

const elementActions = css({
  flex: 'none',
  width: spacing[3],
});

const elementLineNumber = css({
  flex: 'none',
  position: 'relative',
  marginLeft: spacing[1],
});

const addFieldActionsContainer = css({
  position: 'absolute',
  top: 0,
  right: 0,
});

const lineNumberCount = css({
  '&::before': {
    display: 'block',
    width: '100%',
    counterIncrement: 'line-number',
    content: 'counter(line-number)',
    textAlign: 'end',
    color: uiColors.gray.base,
  },
});

const lineNumberCountHidden = css({
  '&::before': {
    visibility: 'hidden',
  },
});

const elementSpacer = css({
  flex: 'none',
});

const elementExpand = css({
  width: spacing[3],
  flex: 'none',
});

const elementKey = css({
  flex: 'none',
  fontWeight: 'bold',
});

const elementDivider = css({
  width: '2ch',
  flex: 'none',
});

const elementValue = css({
  flex: 1,
  minWidth: 0,
  maxWidth: '100%',
});

const elementType = css({
  flex: 'none',
});

const actions = css({
  display: 'none',
});

const actionsVisible = css({
  display: 'block',
});

const HadronElement: React.FunctionComponent<{
  value: HadronElementType;
  editingEnabled: boolean;
  onEditStart: (id: string, field: 'key' | 'value') => void;
  allExpanded: boolean;
  lineNumberSize: number;
}> = ({
  value: element,
  editingEnabled,
  onEditStart,
  allExpanded,
  lineNumberSize,
}) => {
  const autoFocus = useAutoFocusContext();
  const [hoverProps, isHovered] = useHoverState();
  const [focusProps, focusState] = useFocusState();
  const [expanded, setExpanded] = useState(allExpanded);
  const {
    id,
    key,
    value,
    type,
    revert,
    remove,
    expandable,
    children,
    level,
    parentType,
    isPlaceholder,
  } = useHadronElement(element);

  useEffect(() => {
    setExpanded(allExpanded);
  }, [allExpanded]);

  const toggleExpanded = useCallback(() => {
    setExpanded((val) => !val);
  }, []);

  const lineNumberMinWidth = useMemo(() => {
    // Only account for ~ line count length if we are in editing mode
    if (editingEnabled) {
      const charCount = String(lineNumberSize).length;
      return charCount > 2 ? `${charCount}.5ch` : spacing[3];
    }
    return spacing[3];
  }, [lineNumberSize, editingEnabled]);

  const elementProps = mergeProps<HTMLDivElement>(
    { className: hadronElement },
    hoverProps,
    focusProps
  );

  const shouldShowActions =
    editingEnabled && (isHovered || focusState !== FocusState.NoFocus);

  return (
    <>
      <div {...elementProps}>
        <div className={elementActions}>
          <div className={cx(actions, shouldShowActions && actionsVisible)}>
            <EditActions
              onRevert={revert}
              onRemove={remove}
              editing={editingEnabled}
            ></EditActions>
          </div>
        </div>
        <div
          className={cx(
            elementLineNumber,
            editingEnabled && lineNumberCount,
            !isPlaceholder && shouldShowActions && lineNumberCountHidden
          )}
          style={{ minWidth: lineNumberMinWidth }}
        >
          <div
            className={cx(
              actions,
              addFieldActionsContainer,
              !isPlaceholder && shouldShowActions && actionsVisible
            )}
          >
            <AddFieldActions
              editing={editingEnabled}
              type={type.value}
              parentType={parentType === 'Document' ? 'Object' : parentType}
              keyName={key.value}
              onAddFieldAfterElement={() => {
                element.insertSiblingPlaceholder();
              }}
              onAddFieldToElement={
                type.value === 'Object' || type.value === 'Array'
                  ? () => {
                      element.insertPlaceholder();
                    }
                  : undefined
              }
            ></AddFieldActions>
          </div>
        </div>
        <div
          className={elementSpacer}
          style={{ width: spacing[2] + spacing[3] * level }}
        >
          {/* spacer for nested documents */}
        </div>
        <div className={elementExpand}>
          {expandable && (
            <button
              className={buttonReset}
              aria-pressed={expanded}
              aria-label={
                expanded ? 'Collapse field items' : 'Expand field items'
              }
              onClick={toggleExpanded}
            >
              <FAIcon icon={expanded ? 'expanded' : 'collapsed'}></FAIcon>
            </button>
          )}
        </div>
        <div className={elementKey}>
          {key.editable ? (
            <KeyEditor
              value={key.value}
              onChange={(newVal) => {
                key.change(newVal);
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus?.id === id && autoFocus.type === 'key'}
              editing={editingEnabled}
              onEditStart={() => {
                onEditStart(element.uuid, 'key');
              }}
            ></KeyEditor>
          ) : (
            <span>{key.value}</span>
          )}
        </div>
        <div className={elementDivider}>:</div>
        <div className={elementValue}>
          {value.editable ? (
            <ValueEditor
              type={type.value}
              originalValue={value.originalValue}
              value={value.value as string}
              onChange={(newVal) => {
                value.change(newVal);
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus?.id === id && autoFocus.type === 'value'}
              editing={editingEnabled}
              onEditStart={() => {
                onEditStart(element.uuid, 'value');
              }}
            ></ValueEditor>
          ) : (
            <BSONValue
              type={type.value}
              value={value.originalValue}
            ></BSONValue>
          )}
        </div>
        <div className={elementType}>
          <TypeEditor
            editing={editingEnabled}
            type={type.value}
            onChange={(newType) => {
              type.change(newType);
            }}
            // visuallyActive={shouldShowActions}
          ></TypeEditor>
        </div>
      </div>
      {expandable &&
        expanded &&
        children.map((el) => {
          return (
            <HadronElement
              key={el.uuid}
              value={el}
              editingEnabled={editingEnabled}
              onEditStart={onEditStart}
              allExpanded={allExpanded}
              lineNumberSize={lineNumberSize}
            ></HadronElement>
          );
        })}
    </>
  );
};

const AutoFocusContext = createContext<{
  id: string;
  type: 'key' | 'value';
} | null>(null);

function useAutoFocusContext() {
  return useContext(AutoFocusContext);
}

const hadronDocument = css({
  position: 'relative',
  fontFamily: fontFamilies.code,
  fontSize: '12px',
  lineHeight: `${spacing[3]}px`,
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  counterReset: 'line-number',
});

const documentFields = css({});

const HadronDocument: React.FunctionComponent<{
  value: HadronDocumentType;
  // updateStatus?: 'error' | 'succes' | 'confirm-force-update' | null;
  onCopy(): void;
  onClone?: () => void;
  onRemove?: () => void;
  onUpdate?: (force?: boolean) => void;
  initialFieldSize?: number;
}> = ({
  value: document,
  // updateStatus,
  onCopy,
  onClone,
  onRemove,
  onUpdate,
  initialFieldSize = 25,
}) => {
  const editable = !!onUpdate;
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [showFieldSize, setShowFieldSize] = useState(initialFieldSize);
  const [autoFocus, setAutoFocus] = useState<{
    id: string;
    type: 'key' | 'value';
  } | null>(null);

  const visibleElements = [...document.elements].slice(0, showFieldSize);

  return (
    <div className={hadronDocument}>
      <AutoFocusContext.Provider value={autoFocus}>
        <div className={documentFields}>
          {visibleElements.map((el) => {
            return (
              <HadronElement
                value={el}
                key={el.uuid}
                editingEnabled={isEditingEnabled}
                allExpanded={isAllExpanded}
                onEditStart={(id, type) => {
                  setAutoFocus({ id, type });
                  setIsEditingEnabled(true);
                }}
                lineNumberSize={visibleElements.length}
              ></HadronElement>
            );
          })}
        </div>
      </AutoFocusContext.Provider>
      {!isEditingEnabled && (
        <DocumentActionsGroup
          onEdit={
            editable
              ? () => {
                  setIsEditingEnabled(true);
                }
              : undefined
          }
          onCopy={onCopy}
          onClone={onClone}
          onRemove={onRemove}
          onExpand={() => {
            setIsAllExpanded((currentExpanded) => !currentExpanded);
          }}
          expanded={isAllExpanded}
        ></DocumentActionsGroup>
      )}
      <DocumentFieldsToggleGroup
        currentSize={showFieldSize}
        totalSize={document.elements.size}
        onSizeChange={setShowFieldSize}
        // TODO: Move comment from other component
        showHideButton={!isEditingEnabled}
      ></DocumentFieldsToggleGroup>
      <div>
        {isEditingEnabled && (
          <Button
            size="xsmall"
            onClick={() => {
              document.cancel();
              setIsEditingEnabled(false);
              setAutoFocus(null);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default HadronDocument;
