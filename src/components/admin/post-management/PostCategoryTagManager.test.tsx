import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import PostCategoryTagManager from "./PostCategoryTagManager";

const modalProps: Record<string, unknown>[] = [];

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/hooks/queries/use-articles", () => ({
  useCategories: () => ({
    data: [],
  }),
  useTags: () => ({
    data: Array.from({ length: 48 }, (_, index) => ({
      id: `tag-${index}`,
      name: `标签 ${index + 1}`,
      slug: `tag-${index + 1}`,
      count: index,
    })),
  }),
}));

vi.mock("@/lib/api/article", () => ({
  articleApi: {
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    createTag: vi.fn(),
    updateTag: vi.fn(),
    deleteTag: vi.fn(),
  },
}));

vi.mock("@heroui/react", () => ({
  addToast: vi.fn(),
  Modal: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
    modalProps.push(props);
    return <div data-testid="modal">{children}</div>;
  },
  ModalContent: ({
    children,
    className,
  }: {
    children: React.ReactNode | ((onClose: () => void) => React.ReactNode);
    className?: string;
  }) => <section className={className}>{typeof children === "function" ? children(vi.fn()) : children}</section>,
  ModalHeader: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <header className={className}>{children}</header>
  ),
  ModalBody: ({ children, className }: React.PropsWithChildren<{ className?: string }>) => (
    <main className={className}>{children}</main>
  ),
  Tabs: ({ children }: React.PropsWithChildren<Record<string, unknown>>) => <div>{children}</div>,
  Tab: ({ children, title }: React.PropsWithChildren<{ title: React.ReactNode }>) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  Button: ({
    children,
    onPress,
    isIconOnly,
    isDisabled,
    startContent,
    ...props
  }: React.PropsWithChildren<
    { onPress?: () => void; isIconOnly?: boolean; isDisabled?: boolean; startContent?: React.ReactNode } & Record<
      string,
      unknown
    >
  >) => (
    <button
      type="button"
      aria-label={isIconOnly ? "icon button" : undefined}
      disabled={isDisabled}
      onClick={onPress}
      {...props}
    >
      {startContent}
      {children}
    </button>
  ),
}));

describe("PostCategoryTagManager", () => {
  beforeEach(() => {
    modalProps.length = 0;
  });

  it("uses inside modal scrolling when the tag list is long", () => {
    render(<PostCategoryTagManager isOpen onClose={vi.fn()} />);

    expect(screen.getByText("标签 (48)")).toBeInTheDocument();
    expect(modalProps[0]).toMatchObject({
      isOpen: true,
      size: "2xl",
      scrollBehavior: "inside",
    });
  });
});
