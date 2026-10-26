"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";

interface SidebarItem {
  label: string;
  href?: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  items,
  header,
  footer,
  onItemClick,
  className,
  fullWidthOnMobile = true,
  desktopWidth = "300px",
  collapsedWidth = "60px",
  backgroundColor = "bg-neutral-100 dark:bg-neutral-800",
  itemClassName,
  autoCollapse = true,
}: {
  children?: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  items?: SidebarItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: SidebarItem) => void;
  className?: string;
  fullWidthOnMobile?: boolean;
  desktopWidth?: string;
  collapsedWidth?: string;
  backgroundColor?: string;
  itemClassName?: string;
  autoCollapse?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      <SidebarBody 
        className={className} 
        backgroundColor={backgroundColor}
        desktopWidth={desktopWidth}
        collapsedWidth={collapsedWidth}
        fullWidthOnMobile={fullWidthOnMobile}
      >
        {header && <div className="mb-6">{header}</div>}
        
        {items && items.length > 0 && (
          <div className="flex flex-col space-y-2">
            {items.map((item, index) => (
              <SidebarItem 
                key={index} 
                item={item} 
                onClick={() => {
                  if (item.onClick) item.onClick();
                  if (onItemClick) onItemClick(item);
                }}
                className={itemClassName}
              />
            ))}
          </div>
        )}
        
        {children}
        
        {footer && (
          <div className="mt-auto pt-6">
            {footer}
          </div>
        )}
      </SidebarBody>
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  children,
  className,
  backgroundColor = "bg-neutral-100 dark:bg-neutral-800",
  desktopWidth = "300px",
  collapsedWidth = "60px",
  fullWidthOnMobile = true,
  ...props
}: React.ComponentProps<"div"> & {
  backgroundColor?: string;
  desktopWidth?: string;
  collapsedWidth?: string;
  fullWidthOnMobile?: boolean;
}) => {
  return (
    <>
      <DesktopSidebar 
        className={className} 
        backgroundColor={backgroundColor}
        desktopWidth={desktopWidth}
        collapsedWidth={collapsedWidth}
        {...(props as React.ComponentProps<typeof motion.div>)}
      >
        {children}
      </DesktopSidebar>
      <MobileSidebar 
        className={className}
        backgroundColor={backgroundColor}
        fullWidth={fullWidthOnMobile}
        {...props}
      >
        {children}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  backgroundColor = "bg-neutral-100 dark:bg-neutral-800",
  desktopWidth = "300px",
  collapsedWidth = "60px",
  ...props
}: React.ComponentProps<typeof motion.div> & {
  backgroundColor?: string;
  desktopWidth?: string;
  collapsedWidth?: string;
}) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          `h-full px-2 py-4 hidden md:flex md:flex-col ${backgroundColor} shrink-0`,
          className
        )}
        animate={{
          width: animate ? (open ? desktopWidth : collapsedWidth) : desktopWidth,
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  backgroundColor = "bg-neutral-100 dark:bg-neutral-800",
  fullWidth = true,
  ...props
}: React.ComponentProps<"div"> & {
  backgroundColor?: string;
  fullWidth?: boolean;
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          `h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between ${backgroundColor} w-full`
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                `fixed h-full ${fullWidth ? 'w-full' : 'w-3/4'} inset-0 ${backgroundColor} p-6 z-[100] flex flex-col justify-between`,
                className
              )}
            >
              <div
                className="absolute right-6 top-6 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarItem = ({
  item,
  className,
  onClick,
  ...props
}: {
  item: SidebarItem;
  className?: string;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  
  const ItemComponent = item.href ? 'a' : 'button';
  const itemProps = item.href ? { href: item.href } : { type: 'button' as 'button' };
  
  return (
    <ItemComponent
      {...itemProps}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left",
        className
      )}
      onClick={onClick || item.onClick}
      {...props}
    >
      {item.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {item.label}
      </motion.span>
    </ItemComponent>
  );
};

// For backward compatibility
export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: { label: string; href: string; icon: React.JSX.Element | React.ReactNode };
  className?: string;
}) => {
  return (
    <SidebarItem
      item={{
        label: link.label,
        href: link.href,
        icon: link.icon
      }}
      className={className}
      {...props}
    />
  );
};