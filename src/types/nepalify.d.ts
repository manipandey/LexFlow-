declare module 'nepalify' {
  const nepalify: {
    format: (text: string, layout: string) => string;
    availableLayouts: () => string[];
    interceptElementById: (id: string, options: any) => any;
  };
  export default nepalify;
}
