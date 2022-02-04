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

const { Clutter, Gio, GLib, GObject, Shell, St } = imports.gi;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const SystemActions = imports.misc.systemActions;
const ExtensionUtils = imports.misc.extensionUtils;
const System = Main.panel.statusArea.aggregateMenu._system;
const SystemMenu = System.menu;

const GnomeSession = imports.misc.gnomeSession;
let SessionManager = null;

const Config = imports.misc.config;
const SHELL_MAJOR_VERSION = parseInt(Config.PACKAGE_VERSION.split('.')[0]);

let DefaultActions;
let bindFlags;
let item;
let button;

var LabelLauncher = new GObject.registerClass(
class LabelLauncher extends St.Widget {
_init() {
        this._labelText = "";
        this.label = new St.Label({ style_class: 'dash-label' });
        this.label.hide();
        Main.layoutManager.addChrome(this.label);
        this.label_actor = this.label;
        }
        
showLabel(button) {
        this.label.set_text(button.get_accessible_name());
        this.label.opacity = 0;
        this.label.show();
        
        let node = this.label.get_theme_node();
        let stageX;
        let stageY;
        let yOffset;
        
        if(SHELL_MAJOR_VERSION == 3) {
        stageX = Math.floor(button.get_transformed_position().slice()[0] + (button.get_width()/2));
        stageY = Math.floor(Main.panel.statusArea.aggregateMenu.menu.box.get_transformed_position().slice()[1] + Main.panel.statusArea.aggregateMenu.menu.box.get_height());
        yOffset = node.get_length('-x-offset');
        } else if(SHELL_MAJOR_VERSION >= 40) {
        stageX = button.get_transformed_extents().get_center().x;
        stageY = Main.panel.statusArea.aggregateMenu.menu.box.get_transformed_extents().get_bottom_right().y;  
	yOffset = node.get_length('-y-offset');
	}
        
        const labelWidth = this.label.get_width();
        const xOffset = Math.floor(labelWidth / 2);
        
        const x = stageX - xOffset;
        const y = stageY + yOffset;

        this.label.set_position(x, y);
        this.label.ease({
            opacity: 255,
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    	}
    
hideLabel() {
        this.label.ease({
            opacity: 0,
            duration: 100,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            onComplete: () => this.label.hide(),
        });
    	}
});

var _systemMenuButtons = new GObject.registerClass(
class SystemMenuButtons extends PanelMenu.SystemIndicator {

_init() {

    	this._showLabelTimeoutId = 0;
        this._resetHoverTimeoutId = 0;
        this._labelShowing = false;
        
	DefaultActions = new SystemActions.getDefault();
	this._settings = ExtensionUtils.getSettings();
	
	SystemMenu.actor.remove_child(System._orientationLockItem);
	SystemMenu.actor.remove_child(System._settingsItem);
	SystemMenu.actor.remove_child(System._lockScreenItem);
	SystemMenu.actor.remove_child(System._sessionSubMenu);
	
        this._createMenu();
	
	this._connectSettings();
	
	SystemMenu.connect('open-state-changed', (menu, open) => {
		if(!open)
		return;
		DefaultActions._updateOrientationLock();
		DefaultActions._sessionUpdated();
		DefaultActions.forceUpdate();
	});
    	} 

_syncLabel(tooltip, button) {
        if (tooltip.child.hover) {
            if (this._showLabelTimeoutId == 0) {
            	let timeout = this._labelShowing ? 0 : 100;
                this._showLabelTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, timeout,
                    () => {
                        this._labelShowing = true;
                        tooltip.showLabel(button);
                        this._showLabelTimeoutId = 0;
                        return GLib.SOURCE_REMOVE;
                    });
                    GLib.Source.set_name_by_id(this._showLabelTimeoutId, '[gnome-shell] tooltip.showLabel');
                    if (this._resetHoverTimeoutId > 0) {
                    GLib.source_remove(this._resetHoverTimeoutId);
                    this._resetHoverTimeoutId = 0;
                }
            }
        } else {
            if (this._showLabelTimeoutId > 0)
                GLib.source_remove(this._showLabelTimeoutId);
                this._showLabelTimeoutId = 0;
            	tooltip.hideLabel();
            		if (this._labelShowing) {
                		this._resetHoverTimeoutId = GLib.timeout_add(
                    		GLib.PRIORITY_DEFAULT, 100,
                    		() => {
                        	this._labelShowing = false;
                        	this._resetHoverTimeoutId = 0;
                        	return GLib.SOURCE_REMOVE;
                    		});
                GLib.Source.set_name_by_id(this._resetHoverTimeoutId, '[gnome-shell] this._labelShowing');
            	}
            }
    	}
    	
_hookUpLabel(tooltip, button) {
        tooltip.child.connect('notify::hover', () => {
            this._syncLabel(tooltip, button);
        });
        
        tooltip.child.connect('clicked', () => {
            this._labelShowing = false;
            tooltip.hideLabel();
        });
    	}
    	
_createActionButton(iconName, accessibleName) {
        
        let roundButton = new St.Button({ reactive: true,
                                   can_focus: true,
                                   track_hover: true,
                                   accessible_name: accessibleName,
                                   x_expand: true,
                                   x_align: 2,
                                   style_class: 'rounded-menu-buttons',
                                   });
                                   
        roundButton.child = new St.Icon({ icon_name: iconName, icon_size: this._settings.get_int('icon-size') });

        let useCustomColor = this._settings.get_boolean('use-custom-color');
        roundButton.set_style("color: " + `${useCustomColor ? this._settings.get_string('color') : '#eeeeec'};` +
        			" padding: " + this._settings.get_int('padding') + "px; " +
        				"border-radius: " + this._settings.get_int('border-radius') + "px;");

        
        let tooltip = new LabelLauncher();
	tooltip.child = roundButton;
	this._hookUpLabel(tooltip, roundButton);
        
        return roundButton;
    	}
    
_createMenu() {
 	bindFlags = GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE;
        item = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
        let iconSize = this._settings.get_int('icon-size');
        let boolean;
        
        // ORIENTATION BUTTON
        
       	this._orientationButton = this._createActionButton(DefaultActions.orientation_lock_icon, DefaultActions.getName(_('lock-orientation')));
       	this._orientationButton.connect('clicked', () => {
        DefaultActions.activateLockOrientation();
        });
        
        item.actor.add(this._orientationButton);
	DefaultActions.bind_property('can-lock-orientation', this._orientationButton, 'visible', bindFlags);
        
        DefaultActions.connect('notify::orientation-lock-icon', () => {
            let iconName = DefaultActions.orientation_lock_icon;
            let labelText = DefaultActions.getName('lock-orientation');

            this._orientationButton.setIcon(iconName);
            this._orientationButton.label.text = labelText; });
            
        // SETTINGS BUTTON

	let app = this._settingsApp = Shell.AppSystem.get_default().lookup_app('gnome-control-center.desktop');
        if (app) {	
        this._settingsButton = this._createActionButton('org.gnome.Settings-symbolic', _('Settings'));
        this._settingsButton.connect('clicked', () => {
                        				Main.overview.hide();
                					this._settingsApp.activate();
                				      				     });
             				      				     
        item.actor.add(this._settingsButton);
   	} else {
            log('Missing required core component Settings, expect trouble…');
            this._settingsButton = null;
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
        
        boolean = this._settings.get_boolean('remove-suspend-button');
        
        if(boolean) {
	this._suspendButton = null;
	} else {
        item.actor.add(this._suspendButton);
	DefaultActions.bind_property('can-suspend', this._suspendButton, 'visible', bindFlags); }
        
        // SWITCH USER
        
	this._switchUserButton = this._createActionButton('system-switch-user-symbolic', _('Switch User…'));
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
        
        boolean = this._settings.get_boolean('remove-logout-button');
        
        if(boolean) {
	this._logoutButton = null;
	} else {
        item.actor.add(this._logoutButton)
	DefaultActions.bind_property('can-logout', this._logoutButton, 'visible', bindFlags); }
        
        // RESTART
        
        this._restartButton = this._createActionButton('system-reboot-symbolic', _('Restart…'));
        this._restartButton.connect('clicked', () => {
        SHELL_MAJOR_VERSION >= 40 ? DefaultActions.activateRestart() : SessionManager.RebootRemote();
        });
        
        boolean = this._settings.get_boolean('remove-restart-button');
        
        if(boolean) {
	this._restartButton = null;
	} else {
        item.actor.add(this._restartButton)
        SHELL_MAJOR_VERSION >=40 ? DefaultActions.bind_property('can-restart', this._restartButton, 'visible', bindFlags) :
        				DefaultActions.bind_property('can-power-off', this._restartButton, 'visible', bindFlags) }
	
        // POWEROFF
        
        this._powerButton = this._createActionButton('system-shutdown-symbolic', _('Power Off…'));
        this._powerButton.connect('clicked', () => {
        DefaultActions.activatePowerOff();
        });
        
        boolean = this._settings.get_boolean('remove-poweroff-button');
        
        if(boolean) {
	this._powerButton = null;
	} else {
        item.actor.add(this._powerButton)
	DefaultActions.bind_property('can-power-off', this._powerButton, 'visible', bindFlags); }
	
	// Main Course
	
	SystemMenu.box.add_actor(item);
	
	this._getAvailableButtons();
	
	DefaultActions._updateOrientationLock();
	DefaultActions._sessionUpdated();
	DefaultActions.forceUpdate();
    	}
    	
_getAvailableButtons() {
					let BUTTONS_ORDER = this._settings.get_value('buttons-order').deepUnpack();
				   	
				   	const initialArray = [
						this._orientationButton,
						this._settingsButton,
						this._lockButton,
						this._suspendButton,
						this._switchUserButton,
						this._logoutButton,
						this._restartButton,
						this._powerButton
					    	]
						    	
					const orderedArray = BUTTONS_ORDER.map((idx) => initialArray[idx - 1]);
					
					const filterdArray = orderedArray.filter(obj => obj !== null);
					
						for (let i = 0; i < filterdArray.length; i++) {
							item.remove_actor(filterdArray[i]);
							item.actor.add(filterdArray[i]);
							}
}

_connectSettings() {
	this.colorChanged = this._settings.connect('changed::color', this._settingsChanged.bind(this));
	this.useCustomColorChanged = this._settings.connect('changed::use-custom-color', this._settingsChanged.bind(this));
        this.removeSuspendButtonChanged = this._settings.connect('changed::remove-suspend-button', this._settingsChanged.bind(this));
        this.removeLogoutButtonChanged = this._settings.connect('changed::remove-logout-button', this._settingsChanged.bind(this));
        this.removeRestartButtonChanged = this._settings.connect('changed::remove-restart-button', this._settingsChanged.bind(this));
        this.removePoweroffButtonChanged = this._settings.connect('changed::remove-poweroff-button', this._settingsChanged.bind(this));
        this.iconSizeChanged = this._settings.connect('changed::icon-size', this._settingsChanged.bind(this));
        this.borderRadiusChanged = this._settings.connect('changed::border-radius', this._settingsChanged.bind(this));
        this.paddingChanged = this._settings.connect('changed::padding', this._settingsChanged.bind(this));
        this.buttonsOrderChanged = this._settings.connect('changed::buttons-order', this._settingsChanged.bind(this));
    	}
    	
_onDestroy() {

	const disconnectArray = [
				this.colorChanged,
				this.useCustomColorChanged,
				this.removeSuspendButtonChanged,
				this.removeLogoutButtonChanged,
				this.removeRestartButtonChanged,
				this.removePoweroffButtonChanged,
				this.iconSizeChanged,
				this.borderRadiusChanged,
				this.paddingChanged,
				this.buttonsOrderChanged
				]
				
	for (let i = 0; i < disconnectArray.length; i++) {
		if(disconnectArray[i]) 	{
					this._settings.disconnect(disconnectArray[i])
					disconnectArray[i] = 0; }
	}			

	if(this._resetHoverTimeoutID) {
	GLib.source_remove(this._resetHoverTimeoutID);
	this._resetHoverTimeoutID = null;
	}
	}
    	
_settingsChanged() {
	SystemMenu.box.remove_actor(item);
	this._createMenu();
        }
});

function init() {
}

let modifiedMenu;

function enable() {
SessionManager = GnomeSession.SessionManager();
modifiedMenu = new _systemMenuButtons();
}

function disable() {
	SystemMenu.box.remove_actor(item);
	
	if(SessionManager) {
	SessionManager = null;
	}
	
	modifiedMenu._onDestroy();
	modifiedMenu = null;
	
	SystemMenu.actor.insert_child_at_index(System._orientationLockItem, SystemMenu.numMenuItems);
	SystemMenu.actor.insert_child_at_index(System._settingsItem, SystemMenu.numMenuItems);
	SystemMenu.actor.insert_child_at_index(System._lockScreenItem, SystemMenu.numMenuItems);
	SystemMenu.actor.insert_child_at_index(System._sessionSubMenu, SystemMenu.numMenuItems);
}



