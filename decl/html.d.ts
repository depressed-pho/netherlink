/*
 * Usage:
 *
 * import foo from 'foo/bar/baz.html'; // foo: string
 */
declare module '*.html' {
    const content: string;
    export default content;
}
