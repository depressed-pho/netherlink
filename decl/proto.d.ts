/*
 * Usage:
 *
 * import root from 'foo/bar/baz.proto'; // root: any
 */
declare module '*.proto' {
    const root: any;
    export default root;
}
