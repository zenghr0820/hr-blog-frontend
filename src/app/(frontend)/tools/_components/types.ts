export interface ToolItem {
  name: string;
  image: string;
  link: string;
  description: string;
}

export interface ToolCategory {
  title: string;
  description: string;
  tools_list: ToolItem[];
}
