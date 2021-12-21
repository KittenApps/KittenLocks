import { Fragment, forwardRef, memo, useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { Collapse, Divider, Drawer, IconButton, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, ListSubheader, SwipeableDrawer, Typography } from '@mui/material';
import { AccountBox, EnhancedEncryptionTwoTone as AddLockIcon, ShowChart as ChartIcon, ChatTwoTone as ChatIcon, ChevronLeft, CompareArrows as CompareIcon, ExpandLess, ExpandMore,
         HomeTwoTone as HomeIcon, ImageTwoTone, InfoTwoTone, Key as KeyIcon, LockTwoTone as Lock2Icon, LockClockTwoTone as LockClockIcon, Lock as LockIcon, Restore, Search } from '@mui/icons-material';
import { NavLink } from 'react-router-dom';
import { Link as ScrollLink } from 'react-scroll';

const drawerWidth = 250;

const NLink = forwardRef(({ ...props }, ref) => {
  const NLinkClassName = useCallback(({ isActive }) => [props.className, isActive ? 'Mui-selected' : null].filter(Boolean).join(' '), [props.className]);
  return <NavLink ref={ref} {...props} className={NLinkClassName}/>;
});
NLink.displayName = 'NLink';

// eslint-disable-next-line no-unused-vars
const SLink = forwardRef((props, _) => <ScrollLink smooth offset={-72} spyThrottle={500} activeClass="Mui-selected" spy {...props}/>);
SLink.displayName = 'SLink';

const DrawerHeader = styled('div')(({ theme }) => ({
display: 'flex',
alignItems: 'center',
padding: theme.spacing(0, 1),
...theme.mixins.toolbar,
justifyContent: 'flex-end'
}));

const ResponsiveDrawer = memo(({ isDesktop, open, handleDrawerOpen, handleDrawerClose, children }) => {
if (isDesktop) return (
  <Drawer variant="persistent" anchor="left" open={open} sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
    <DrawerHeader>
      <IconButton onClick={handleDrawerClose}><ChevronLeft/></IconButton>
    </DrawerHeader>
    <Divider />
    {children}
  </Drawer>
);
return <SwipeableDrawer elevation={2} sx={{ zIndex: t => t.zIndex.drawer, '& .MuiDrawer-paper': { maxWidth: '85%' } }} anchor="left" open={open} onClose={handleDrawerClose} onOpen={handleDrawerOpen}>{children}</SwipeableDrawer>;
});
ResponsiveDrawer.displayName = 'ResponsiveDrawer';

const SubNavElement = memo(({ nav, handleListClick, subNavSelected, setSubNavSelected }) => {
  const handleSubNavExpand = useCallback(e => {setSubNavSelected(nav.id === subNavSelected ? '' : nav.id); e.stopPropagation();}, [nav.id, setSubNavSelected, subNavSelected]);
  const handleSubNavActive = useCallback(() => setSubNavSelected(nav.id), [nav.id, setSubNavSelected]);
  return (
    <>
      <ListItem
        onClick={handleListClick}
        component={SLink}
        to={nav.id}
        onSetActive={handleSubNavActive}
        dense
        disablePadding
        secondaryAction={<IconButton onClick={handleSubNavExpand} edge="end">{subNavSelected === nav.id ? <ExpandLess/> : <ExpandMore/>}</IconButton>}
      >
        <ListItemButton><ListItemIcon><LockClockIcon/></ListItemIcon><ListItemText primary={nav.title} secondary={nav.subtitle}/></ListItemButton>
      </ListItem>
      <Collapse in={subNavSelected === nav.id} timeout="auto">
        <List component="div" disablePadding>
          <ListItemButton key={`info-${nav.id}`} onClick={handleListClick} component={SLink} hashSpy to={`info-${nav.id}`} dense sx={{ pl: 4 }}>
            <ListItemIcon><InfoTwoTone/></ListItemIcon>
            <ListItemText primary="Lock Information"/>
          </ListItemButton>
          { nav.hist && (
            <ListItemButton key={`hist-${nav.id}`} onClick={handleListClick} component={SLink} hashSpy to={`hist-${nav.id}`} dense sx={{ pl: 4 }}>
              <ListItemIcon><Restore/></ListItemIcon>
              <ListItemText primary="Lock History"/>
            </ListItemButton>
          )}
          { nav.veri && (
            <ListItemButton key={`veri-${nav.id}`} onClick={handleListClick} component={SLink} hashSpy to={`veri-${nav.id}`} dense sx={{ pl: 4 }}>
              <ListItemIcon><ImageTwoTone/></ListItemIcon>
              <ListItemText primary="Verifications"/>
            </ListItemButton>
          )}
        </List>
      </Collapse>
    </>
  );
});
SubNavElement.displayName = 'SubNavElement';

function AppDrawer({ isDesktop, setOpen, open, subNav }){
  const [subNavSelected, setSubNavSelected] = useState('');
  useEffect(() => {
    if (subNav && subNav.locks.length > 0) setSubNavSelected(subNav.locks[0].id);
  }, [subNav]);

  const handleDrawerOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleDrawerClose = useCallback(() => setOpen(false), [setOpen]);
  const handleListClick = useCallback(() => !isDesktop && setOpen(false), [isDesktop, setOpen]);

  return (
    <ResponsiveDrawer open={open} isDesktop={isDesktop} handleDrawerClose={handleDrawerClose} handleDrawerOpen={handleDrawerOpen} >
      <List onClick={handleListClick}>
        <ListItemButton key={0} component={NLink} to="/">         <ListItemIcon><HomeIcon/></ListItemIcon>   <ListItemText primary="Home"/></ListItemButton>
        <Divider key={-1}/>
        <ListItemButton key={1} component={NLink} to="/lock">     <ListItemIcon><LockIcon/></ListItemIcon>   <ListItemText primary="My Lock Profile"/></ListItemButton>
        <ListItemButton key={2} component={NLink} to="/wearers">  <ListItemIcon><KeyIcon/></ListItemIcon>    <ListItemText primary="My Wearers Locks"/></ListItemButton>
        <ListItemButton key={3} component={NLink} to="/locks">    <ListItemIcon><Lock2Icon/></ListItemIcon>  <ListItemText primary="Public Lock Profiles"/></ListItemButton>
        <Divider key={-2}/>
        <ListItemButton key={4} component={NLink} to="/charts">   <ListItemIcon><ChartIcon/></ListItemIcon>  <ListItemText primary="Public Lock Charts"/></ListItemButton>
        <ListItemButton disabled key={5} component={NLink} to="/"><ListItemIcon><AddLockIcon/></ListItemIcon><ListItemText primary="Voting Game"/></ListItemButton>
        <ListItemButton key={6} component={NLink} to="/trans">    <ListItemIcon><CompareIcon/></ListItemIcon><ListItemText primary="Lock Transfer"/></ListItemButton>
        <Divider key={-3}/>
        <ListItemButton key={7} component={NLink} to="/discord">  <ListItemIcon><ChatIcon/></ListItemIcon>   <ListItemText primary="Discord Community"/></ListItemButton>
      </List>
      { subNav && (
        <List disablePadding>
          <Divider key={-1}/>
          <ListSubheader sx={{ textAlign: 'center' }}>SUB-NAVIGATION BAR</ListSubheader>
          { subNav.public && (
            <Fragment key="public">
              <ListItemButton onClick={handleListClick} component={SLink} to="search" hashSpy dense><ListItemIcon><Search/></ListItemIcon><ListItemText primary="Lock Profiles Search"/></ListItemButton>
              <ListItemButton onClick={handleListClick} component={SLink} to="profile" hashSpy dense><ListItemIcon><AccountBox/></ListItemIcon><ListItemText primary={`${subNav.public}'s Profile`}/></ListItemButton>
            </Fragment>
          )}
          { subNav.locks.map(nav => (
            <SubNavElement key={nav.id} nav={nav} handleListClick={handleListClick} subNavSelected={subNavSelected} setSubNavSelected={setSubNavSelected}/>
          ))}
        </List>
      )}
      <div style={{ flexGrow: 1 }}/>
      <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1 }}>KittenLocks v{process.env.npm_package_version} (<Link href={`https://github.com/KittenApps/KittenLocks/commit/${process.env.COMMIT_REF}`} target="_blank" rel="noreferrer">{process.env.COMMIT_REF.slice(0, 7)}</Link>)</Typography>
    </ResponsiveDrawer>
  );
}

export default memo(AppDrawer);