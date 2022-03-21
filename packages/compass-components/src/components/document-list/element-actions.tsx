import React, { useState } from 'react';
import type { TypeCastTypes } from 'hadron-type-checker';
import { Menu, MenuItem } from '@leafygreen-ui/menu';
import { buttonReset, FAIcon } from './document';
import { css, cx } from '@leafygreen-ui/emotion';
import { spacing } from '@leafygreen-ui/tokens';

export const EditActions: React.FunctionComponent<{
  onRemove?: (() => void) | null;
  onRevert?: (() => void) | null;
  editing?: boolean;
}> = ({ editing, onRemove, onRevert }) => {
  return (
    <>
      {editing &&
        (onRevert ? (
          <button
            className={buttonReset}
            aria-label="Revert changes"
            onClick={onRevert}
          >
            <FAIcon icon="revert"></FAIcon>
          </button>
        ) : onRemove ? (
          <button
            className={buttonReset}
            aria-label="Remove field"
            onClick={onRemove}
          >
            <FAIcon icon="remove"></FAIcon>
          </button>
        ) : null)}
    </>
  );
};

const addFieldButton = css({
  display: 'block',
  width: spacing[3],
  height: spacing[3],
  marginLeft: 'auto',
  boxShadow: `inset 0 0 0 1px currentColor`,
  borderRadius: '2px',
});

const item = css({
  // whiteSpace: 'nowrap',
});

export const AddFieldActions: React.FunctionComponent<{
  type: TypeCastTypes;
  parentType: TypeCastTypes;
  editing?: boolean;
  keyName: string;
  onAddFieldToElement?: () => void;
  onAddFieldAfterElement: () => void;
}> = ({
  editing,
  type,
  parentType,
  keyName,
  onAddFieldToElement,
  onAddFieldAfterElement,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!editing) {
    return null;
  }

  return (
    <Menu
      open={isOpen}
      setOpen={setIsOpen}
      trigger={({ children, ...props }: { children: React.ReactChildren }) => {
        return (
          <button className={cx(buttonReset, addFieldButton)} {...props}>
            +{children}
          </button>
        );
      }}
      align="bottom"
      justify="start"
    >
      {onAddFieldToElement && (
        <MenuItem
          onClick={() => {
            setIsOpen(false);
            onAddFieldToElement();
          }}
        >
          <span className={item}>
            <FAIcon icon="addChild"></FAIcon>&nbsp;Add{' '}
            {type === 'Array' ? 'item' : 'field'} to <b>{keyName}</b>
          </span>
        </MenuItem>
      )}
      <MenuItem
        onClick={() => {
          setIsOpen(false);
          onAddFieldAfterElement();
        }}
      >
        <span className={item}>
          <FAIcon icon="addSibling"></FAIcon>&nbsp;Add{' '}
          {parentType === 'Array' ? 'item' : 'field'} after <b>{keyName}</b>
        </span>
      </MenuItem>
    </Menu>
  );
};
