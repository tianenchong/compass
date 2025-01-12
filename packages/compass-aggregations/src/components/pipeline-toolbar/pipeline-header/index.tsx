import React from 'react';
import { css, spacing, Body, Icon } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineStages from './pipeline-stages';
import PipelineActions from './pipeline-actions';
import { showSavedPipelines } from '../../../modules/saved-pipeline';

const containerStyles = css({
  display: 'grid',
  gap: spacing[4],
  gridTemplateAreas: '"pipelineTextAndOpen pipelineStages pipelineAction"',
  gridTemplateColumns: 'min-content',
  alignItems: 'center',
});

const pipelineTextAndOpenStyles = css({
  display: 'flex',
  gridArea: 'pipelineTextAndOpen',
  gap: spacing[2],
});
const openSavedPipelinesStyles = css({
  border: 'none',
  backgroundColor: 'transparent',
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
});

const pipelineStagesStyles = css({
  gridArea: 'pipelineStages',
  display: 'flex',
});
const pipelineActionStyles = css({
  gridArea: 'pipelineAction',
  justifySelf: 'end',
  display: 'flex',
});

type PipelineHeaderProps = {
  isOptionsVisible: boolean;
  onShowSavedPipelines: () => void;
  onToggleOptions: () => void;
};

export const PipelineHeader: React.FunctionComponent<PipelineHeaderProps> = ({
  onShowSavedPipelines,
  onToggleOptions,
  isOptionsVisible,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-header">
      <div className={pipelineTextAndOpenStyles}>
        <Body weight="medium">Pipeline</Body>
        <button
          data-testid="pipeline-toolbar-open-pipelines-button"
          onClick={() => onShowSavedPipelines()}
          className={openSavedPipelinesStyles}
          aria-label="Open saved pipelines"
        >
          <Icon glyph="Folder" />
          <Icon glyph="CaretDown" />
        </button>
      </div>
      <div className={pipelineStagesStyles}>
        <PipelineStages />
      </div>
      <div className={pipelineActionStyles}>
        <PipelineActions
          onToggleOptions={onToggleOptions}
          isOptionsVisible={isOptionsVisible}
        />
      </div>
    </div>
  );
};

export default connect(null, {
  onShowSavedPipelines: showSavedPipelines,
})(PipelineHeader);
