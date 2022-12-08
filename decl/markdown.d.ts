/*
 * Usage:
 *
 * import foo from 'foo/bar/baz.md'; // foo: string
 */
declare module '*.md' {
    const content: string;
    export default content;
}
