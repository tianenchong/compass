import React, { useMemo } from 'react';
import type { Element as HadronElementType } from 'hadron-document';
import TypeChecker from 'hadron-type-checker';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors } from '@leafygreen-ui/palette';
import BSONValue from '../bson-value';
import { spacing } from '@leafygreen-ui/tokens';

const editorReset = css({
  padding: 0,
  margin: 0,
  border: 'none',
  boxShadow: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
});

const editorOutline = css({
  '&:focus, &:active': {
    borderRadius: `2px`,
    boxShadow: `0 0 0 2px ${uiColors.focus}`,
  },
});

export const KeyEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  value: string;
  onChange(newVal: string): void;
  autoFocus?: boolean;
}> = ({ editing, value, onChange, autoFocus, onEditStart }) => {
  const width = `${Math.max(value.length, 1)}ch`;

  return (
    <>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(evt) => {
            onChange(evt.currentTarget.value);
          }}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          className={cx(editorReset, editorOutline)}
          style={{ width }}
          spellCheck="false"
        ></input>
      ) : (
        // Double-click is not accessible so no reason for this to be a button
        <div onDoubleClick={onEditStart} style={{ width }}>
          {value}
        </div>
      )}
    </>
  );
};

const textareaContainer = css({
  width: '100%',
  maxWidth: '100%',
  '&::before, &::after': {
    content: "'\"'",
    userSelect: 'none',
  },
});

const editorTextarea = css({
  display: 'inline-block',
  whiteSpace: 'nowrap',
  // 2ch for " around the textarea
  maxWidth: 'calc(100% - 2ch)',
  verticalAlign: 'top',
});

export const ValueEditor: React.FunctionComponent<{
  editing?: boolean;
  onEditStart(): void;
  type: string;
  value: string;
  originalValue: unknown;
  onChange(newVal: string): void;
  autoFocus?: boolean;
}> = ({
  editing,
  onEditStart,
  type,
  value,
  originalValue,
  onChange,
  autoFocus,
}) => {
  const val = String(value);

  const inputStyle = useMemo(() => {
    if (type === 'String') {
      const lines = val.split('\n');
      const longestLineCharLength = Math.max(
        ...lines.map((line) => line.length)
      );
      const width = `${Math.min(
        Math.max(
          // Adding one to account for a textarea resize icon button thingie
          longestLineCharLength + 1,
          // Minimum 3 symbols: 2 so that clicking is possible + 1 for the
          // resize icon
          3
        ),
        70
      )}ch`;
      const minLines = Math.max(
        lines.length,
        longestLineCharLength > 70 ? 2 : 1
      );
      const maxLines = Math.min(minLines, 10);
      const minHeight = spacing[3] * minLines;
      const height = spacing[3] * maxLines;

      return { width, minHeight, height };
    }

    return { width: `${Math.max(val.length, 1)}ch` };
  }, [val, type]);

  return (
    <>
      {editing ? (
        type === 'String' ? (
          <div className={textareaContainer}>
            <textarea
              value={val}
              onChange={(evt) => {
                onChange(evt.currentTarget.value);
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus={autoFocus}
              className={cx(editorReset, editorOutline, editorTextarea)}
              spellCheck="false"
              style={inputStyle}
            ></textarea>
          </div>
        ) : (
          <input
            type="text"
            value={val}
            onChange={(evt) => {
              onChange(evt.currentTarget.value);
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={autoFocus}
            className={cx(editorReset, editorOutline)}
            style={inputStyle}
            spellCheck="false"
          ></input>
        )
      ) : (
        // Double-click is not accessible so no reason for this to be a button,
        // users won't be able to interact with it anyway
        <div onDoubleClick={onEditStart}>
          <BSONValue type={type as any} value={originalValue}></BSONValue>
        </div>
      )}
    </>
  );
};

const TYPES = TypeChecker.castableTypes(true);

const longestTypeNameCharLength = Math.max(...TYPES.map((type) => type.length));

const typeEditor = css({
  color: uiColors.gray.base,
  appearance: 'none',
  // Accounting for the margin that appearance: auto will add to the shadow dom
  // inside select node
  paddingLeft: spacing[1],
  width: `calc(${longestTypeNameCharLength}ch + ${spacing[4]}px)`,
  '&:hover, &:focus, &:focus-within, &:active': {
    appearance: 'auto',
    paddingLeft: 0,
    color: 'inherit',
  },
});

const typeEditorActive = css({
  appearance: 'auto',
  paddingLeft: 0,
});

export const TypeEditor: React.FunctionComponent<{
  editing?: boolean;
  type: HadronElementType['type'];
  onChange(newVal: HadronElementType['type']): void;
  visuallyActive?: boolean;
}> = ({ editing, type, onChange, visuallyActive }) => {
  return (
    <>
      {editing && (
        // This rule is deprecated
        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-onchange.md#deprecated-no-onchange
        // eslint-disable-next-line jsx-a11y/no-onchange
        <select
          value={type}
          onChange={(evt) => {
            onChange(evt.currentTarget.value as HadronElementType['type']);
          }}
          className={cx(
            editorReset,
            editorOutline,
            typeEditor,
            visuallyActive && typeEditorActive
          )}
        >
          {TYPES.map((type) => {
            return (
              <option key={type} value={type}>
                {type}
              </option>
            );
          })}
        </select>
      )}
    </>
  );
};
