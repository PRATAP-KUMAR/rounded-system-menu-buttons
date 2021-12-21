/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

'use strict';

const { GObject, Shell, St } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const SystemActions = imports.misc.systemActions;
const ExtensionUtils = imports.misc.extensionUtils;
const System = Main.panel.statusArea.aggregateMenu._system;
const SystemMenu = System.menu;

let DefaultActions;
let bindFlags = GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE;
let item;

var _systemMenuButtons = new GObject.registerClass(
class SystemMenuButtons extends PanelMenu.SystemIndicator {

_init() {

	DefaultActions = new SystemActions.getDefault();
	this._settings = ExtensionUtils.getSettings();
	
	System._orientationLockItem.hide();
	System._settingsItem.hide();
	System._lockScreenItem.hide();
	SystemMenu.actor.remove_child(System._sessionSubMenu);
	
	this._createMenu();
	this._connectSettings();
	
	SystemMenu.connect('open-state-changed', (menu, open) => {
		if(!open)
		return;
		DefaultActions.forceUpdate();
	});
    }        

_createActionButton(iconName, accessibleName) {
        let icon = new St.Button({ reactive: true,
                                   can_focus: true,
                                   track_hover: true,
                                   accessible_name: accessibleName,
                                   x_expand: true,
                                   style_class: 'system-menu-action' });
        icon.child = new St.Icon({ icon_name: iconName, icon_size: this._settings.get_int('icon-size') });
        return icon;
    }

_createMenu() {
        item = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        let iconSize = this._settings.get_int('icon-size');
       
        // ORIENTATION BUTTON
        
        this._orientationButton = this._createActionButton(DefaultActions.orientation_lock_icon, DefaultActions.getName('lock-orientation'));
        this._orientationButton.connect('clicked', () => {
        DefaultActions.activateLockOrientation();
        });
        
        item.actor.add(this._orientationButton);
	DefaultActions.bind_property('can-lock-orientation', this._orientationButton, 'visible', bindFlags);
        
        DefaultActions.connect('notify::orientation-lock-icon', () => {
            let iconName = DefaultActions.orientation_lock_icon;
            let labelText = DefaultActions.getName('lock-orientation');

            this._orientationButton.setIcon(iconName);
            this._orientationButton.label.text = labelText;
        });
        
        // SETTINGS BUTTON

	let app = this._settingsApp = Shell.AppSystem.get_default().lookup_app('gnome-control-center.desktop');
        if (app) {	
        this._settingsButton = this._createActionButton('org.gnome.Settings-symbolic', 'Settings');
        this._settingsButton.connect('clicked', () => {
                        				Main.overview.hide();
                					this._settingsApp.activate();
                				      				     });
             				      				     
        item.actor.add(this._settingsButton);
   	} else {
            log('Missing required core component Settings, expect trouble…');
            this._settingsButton = new St.Widget();
        } 
        
        //  LOCK BUTTON
        
        this._lockButton = this._createActionButton('changes-prevent-symbolic', _('Lock'));
        this._lockButton.connect('clicked', () => {
        DefaultActions.activateLockScreen();
        });
        
        item.actor.add(this._lockButton);
        DefaultActions.bind_property('can-lock-screen', this._lockButton, 'visible', bindFlags);
        
        // SUSPEND
        
        this._suspendButton = this._createActionButton('media-playback-pause-symbolic', _('Suspend'));
        this._suspendButton.connect('clicked', () => {
        DefaultActions.activateSuspend();
        });
        
        item.actor.add(this._suspendButton);
        DefaultActions.bind_property('can-suspend', this._suspendButton, 'visible', bindFlags);
        
        // SWITCH USER
        
        this._switchUserButton = this._createActionButton('system-switch-user-symbolic', _('Switch User'));
        this._switchUserButton.connect('clicked', () => {
        DefaultActions.activateSwitchUser();
        });
        
        item.actor.add(this._switchUserButton);
	DefaultActions.bind_property('can-switch-user', this._switchUserButton, 'visible', bindFlags);       
        
        // LOGOUT
        
        this._logoutButton = this._createActionButton('system-log-out-symbolic', _('Log Out'));
        this._logoutButton.connect('clicked', () => {
        DefaultActions.activateLogout();
        });
        
        item.actor.add(this._logoutButton);
        DefaultActions.bind_property('can-logout', this._logoutButton, 'visible', bindFlags);        
        
        // RESTART
        
        this._restartButton = this._createActionButton('system-reboot-symbolic', _('Restart'));
        this._restartButton.connect('clicked', () => {
        DefaultActions.activateRestart();
        });
        
        item.actor.add(this._restartButton);
	DefaultActions.bind_property('can-restart', this._restartButton, 'visible', bindFlags);   
	        
        // POWEROFF
        
        this._powerButton = this._createActionButton('system-shutdown-symbolic', _('Power Off'));
        this._powerButton.connect('clicked', () => {
        DefaultActions.activatePowerOff();
        });
        
        item.actor.add(this._powerButton);
	DefaultActions.bind_property('can-power-off', this._powerButton, 'visible', bindFlags);
	
	SystemMenu.box.add_actor(item);
	
	DefaultActions.forceUpdate();
    }
    
_connectSettings() {
        this._settings.connect('changed::icon-size', this._sizeChanged.bind(this));
    }    
    
_sizeChanged() {
	SystemMenu.box.remove_actor(item);
	this._createMenu();
        }
});

function init() {
}

let modifiedMenu;

function enable() {
modifiedMenu = new _systemMenuButtons();
}

function disable() {
	SystemMenu.box.remove_actor(item);
	if(Main.sessionMode.currentMode !== 'unlock-dialog') {
		System._orientationLockItem.show();
		DefaultActions.bind_property('can-lock-orientation', System._orientationLockItem, 'visible', bindFlags);
		System._settingsItem.show();
		System._lockScreenItem.show();
	}
	SystemMenu.box.insert_child_at_index(System._orientationLockItem, SystemMenu.numMenuItems);
	SystemMenu.box.insert_child_at_index(System._sessionSubMenu, SystemMenu.numMenuItems);
	modifiedMenu = null;
}
