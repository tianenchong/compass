import ms from 'ms';

const USER_TYPING_DEBOUNCE_MS = 100;

const FEATURE_FLAG_REGEX = /^(enable|disable) (\w+)\s*$/;
const RESET_STATE = 'reset';
const APPLY_STATE = 'apply';

const DEFAULT_FILTER = {};
const DEFAULT_PROJECT = null;
const DEFAULT_SORT = null;
const DEFAULT_SKIP = 0;
const DEFAULT_LIMIT = 0;
const DEFAULT_SAMPLE = false;

const DEFAULT_MAX_TIME_MS = ms('10 seconds');
const DEFAULT_SAMPLE_SIZE = 1000;
const DEFAULT_STATE = RESET_STATE;

export {
  USER_TYPING_DEBOUNCE_MS,
  FEATURE_FLAG_REGEX,
  RESET_STATE,
  APPLY_STATE,
  DEFAULT_FILTER,
  DEFAULT_PROJECT,
  DEFAULT_SORT,
  DEFAULT_SKIP,
  DEFAULT_LIMIT,
  DEFAULT_SAMPLE,
  DEFAULT_MAX_TIME_MS,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_STATE
};
