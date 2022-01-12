import type { MongoClientOptions } from 'mongodb';

import { ConnectionOptions } from 'mongodb-data-service';
import ConnectionString from 'mongodb-connection-string-url';

export type FieldName =
  | 'hosts'
  | 'isSrv'
  | 'username'
  | 'password'
  | 'hostname'
  | 'kerberosPrincipal'
  | 'ldapUsername'
  | 'ldapPassword'
  | 'schema'
  | 'sshHostname'
  | 'sshUsername'
  | 'sshPassword'
  | 'sshIdentityKeyFile';

export type ConnectionFormError = {
  fieldName?: FieldName;
  fieldIndex?: number;
  message: string;
};

export interface ConnectionFormWarning {
  message: string;
}

export function errorMessageByFieldName(
  errors: ConnectionFormError[],
  fieldName: FieldName
): string | undefined {
  return (errors || []).find((err) => err.fieldName === fieldName)?.message;
}

export function fieldNameHasError(
  errors: ConnectionFormError[],
  fieldName: FieldName
): boolean {
  return !!errorMessageByFieldName(errors, fieldName);
}

export function errorMessageByFieldNameAndIndex(
  errors: ConnectionFormError[],
  fieldName: FieldName,
  fieldIndex: number
): string | undefined {
  return (errors || []).find(
    (err) => err.fieldName === fieldName && err.fieldIndex === fieldIndex
  )?.message;
}

export function validateConnectionOptionsErrors(
  connectionOptions: ConnectionOptions
): ConnectionFormError[] {
  const connectionString = getConnectionString(connectionOptions);

  return [
    ...validateAuthMechanismErrors(connectionString),
    ...validateSSHTunnelErrors(connectionOptions),
  ];
}

function validateAuthMechanismErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const authMechanism = connectionString
    .typedSearchParams<MongoClientOptions>()
    .get('authMechanism');
  switch ((authMechanism || '').toUpperCase()) {
    case '':
      return validateDefaultAuthMechanismErrors(connectionString);
    case 'MONGODB-X509':
      return validateX509Errors(connectionString);
    case 'GSSAPI':
      return validateKerberosErrors(connectionString);
    case 'PLAIN':
      return validateLDAPErrors(connectionString);
    case 'SCRAM-SHA-1':
    case 'SCRAM-SHA-256':
      return validateScramShaErrors(connectionString);
    default:
      return [];
  }
}

function validateScramShaErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  return validateUsernameAndPasswordErrors(connectionString);
}

function validateDefaultAuthMechanismErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const { username, password } = connectionString;
  if (!username && !password) {
    return [];
  }
  return validateUsernameAndPasswordErrors(connectionString);
}

function validateUsernameAndPasswordErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const { username, password } = connectionString;
  const errors: ConnectionFormError[] = [];
  if (!username) {
    errors.push({
      fieldName: 'username',
      message: 'Username is missing.',
    });
  }

  if (!password) {
    errors.push({
      fieldName: 'password',
      message: 'Password is missing.',
    });
  }
  return errors;
}
function validateX509Errors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  if (!isSecure(connectionString)) {
    errors.push({
      message: 'TLS must be enabled in order to use x509 authentication.',
    });
  }
  if (!connectionString.searchParams.has('tlsCertificateKeyFile')) {
    errors.push({
      message: 'A Client Certificate is required with x509 authentication.',
    });
  }
  return errors;
}

function validateLDAPErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  return validateUsernameAndPasswordErrors(connectionString);
}
function validateKerberosErrors(
  connectionString: ConnectionString
): ConnectionFormError[] {
  const errors: ConnectionFormError[] = [];
  if (!connectionString.username) {
    errors.push({
      fieldName: 'kerberosPrincipal',
      message: 'Principal name is required with Kerberos.',
    });
  }
  return errors;
}

function validateSSHTunnelErrors(
  connectionOptions: ConnectionOptions
): ConnectionFormError[] {
  if (!connectionOptions.sshTunnel) {
    return [];
  }
  const errors: ConnectionFormError[] = [];
  if (!connectionOptions.sshTunnel.host) {
    errors.push({
      fieldName: 'sshHostname',
      message: 'A hostname is required to connect with an SSH tunnel',
    });
  }

  if (
    !connectionOptions.sshTunnel.password &&
    !connectionOptions.sshTunnel.identityKeyFile
  ) {
    errors.push({
      message:
        'When connecting via SSH tunnel either password or identity file is required',
    });
  }

  if (
    connectionOptions.sshTunnel.identityKeyPassphrase &&
    !connectionOptions.sshTunnel.identityKeyFile
  ) {
    errors.push({
      fieldName: 'sshIdentityKeyFile',
      message: 'File is required along with passphrase.',
    });
  }

  return errors;
}

export function getConnectionString(
  connectionOptions: ConnectionOptions
): ConnectionString {
  return new ConnectionString(connectionOptions.connectionString);
}

export function isSecure(connectionString: ConnectionString): boolean {
  const sslParam = connectionString.searchParams.get('ssl');
  const tlsParam = connectionString.searchParams.get('tls');
  if (!sslParam && !tlsParam) {
    return connectionString.isSRV;
  }

  return sslParam === 'true' || tlsParam === 'true';
}

export function validateConnectionOptionsWarnings(
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  const connectionString = getConnectionString(connectionOptions);
  return [
    ...validateAuthMechanismWarnings(connectionString),
    ...validateReadPreferenceWarnings(connectionString),
    ...validateDeprecatedOptionsWarnings(connectionString),
    ...validateCertificateValidationWarnings(connectionString),
    ...validateDirectConnectionAndSrvWarnings(connectionString),
    ...validateDirectConnectionAndReplicaSetWarnings(connectionString),
    ...validateDirectConnectionAndMultiHostWarnings(connectionString),
    ...validateTLSAndHostWarnings(connectionOptions),
  ];
}

function validateCertificateValidationWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (
    isSecure(connectionString) &&
    (connectionString.searchParams.has('tlsInsecure') ||
      connectionString.searchParams.has('tlsAllowInvalidHostnames') ||
      connectionString.searchParams.has('tlsAllowInvalidCertificates'))
  ) {
    warnings.push({
      message:
        'Disabling certificate validation is not recommended as it may create a security vulnerability',
    });
  }

  return warnings;
}
function validateDeprecatedOptionsWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (connectionString.searchParams.has('tlsCertificateFile')) {
    warnings.push({
      message:
        'tlsCertificateFile is deprecated and will be removed in future versions of Compass, please embed the client key and certificate chain in a single .pem bundle and use tlsCertificateKeyFile instead.',
    });
  }

  return warnings;
}

function validateReadPreferenceWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  const VALID_READ_PREFERENCES = [
    'primary',
    'primaryPreferred',
    'secondary',
    'secondaryPreferred',
    'nearest',
  ];
  const readPreference = connectionString.searchParams.get('readPreference');
  if (readPreference && !VALID_READ_PREFERENCES.includes(readPreference)) {
    warnings.push({
      message: `Unknown read preference ${readPreference}`,
    });
  }
  return warnings;
}

function validateAuthMechanismWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  const authMechanism =
    connectionString.searchParams.get('authMechanism') || '';

  if (authMechanism === 'GSSAPI' && connectionString.password) {
    warnings.push({
      message: 'The password is ignored with Kerberos.',
    });
  }

  return warnings;
}

function validateDirectConnectionAndSrvWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (
    connectionString.isSRV &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection not supported with SRV URI.',
    });
  }
  return warnings;
}

function validateDirectConnectionAndReplicaSetWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (
    connectionString.searchParams.get('replicaSet') &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection is not supported with replicaSet.',
    });
  }
  return warnings;
}

function validateDirectConnectionAndMultiHostWarnings(
  connectionString: ConnectionString
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  if (
    connectionString.hosts.length > 1 &&
    connectionString.searchParams.get('directConnection') === 'true'
  ) {
    warnings.push({
      message: 'directConnection is not supported with multiple hosts.',
    });
  }
  return warnings;
}

function validateTLSAndHostWarnings(
  connectionOptions: ConnectionOptions
): ConnectionFormWarning[] {
  const warnings: ConnectionFormWarning[] = [];
  const connectionString = getConnectionString(connectionOptions);
  if (connectionString.host !== 'localhost' && !isSecure(connectionString)) {
    warnings.push({
      message:
        'Connecting without tls is not recommended as it may create a security vulnerability.',
    });
  }
  return warnings;
}
