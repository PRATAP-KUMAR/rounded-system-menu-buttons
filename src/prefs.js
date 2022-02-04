const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;

const ExtensionUtils = imports.misc.extensionUtils;

const GTK_VERSION = Gtk.get_major_version();
        let add
        GTK_VERSION == 4  ? add = 'append' : add = 'add';

function init() {
}

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    		if(GTK_VERSION == 3) {
    			widget.widget.show_all(); }
    return widget.widget;
}

class PrefsWidget {
	constructor() {
		this._settings = ExtensionUtils.getSettings();
		
		this.BC_button = new Gtk.ColorButton();
        	this._setButtonColor();
        	
		this.widget = new Gtk.Grid({ visible: true, column_homogeneous: true });
		this.notebook = new Gtk.Notebook({ visible: true });
		
		this.widget.attach(this.notebook, 0, 0, 1, 1);

		// Basic Settings Page
		    
    		let grid = new Gtk.Grid({
		column_spacing: 12, row_spacing: 12,
		column_homogeneous: true,
		hexpand: true, vexpand: true,
		margin_start: 14, margin_end: 14, margin_top: 14, margin_bottom: 14,
		visible: true
	    	});
    
    
    		let vbox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, visible: true });
    
    		grid.attach(vbox, 0, 0, 3, 1);

	        vbox[add](this.selectButtonColor());
        	vbox[add](this.customColorButton());
        	vbox[add](this.adjustIconSize());
        	vbox[add](this.adjustPadding());
        	vbox[add](this.adjustBorderRadius());
        	vbox[add](this.resetButton());
        	vbox[add](new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, margin_bottom: 10, margin_top: 10 }));
        	vbox[add](this.removeSuspendButton());
        	vbox[add](this.removeLogoutButton());
        	vbox[add](this.removeRestartButton());
        	vbox[add](this.removePoweroffButton());
        	vbox[add](new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, margin_bottom: 10, margin_top: 10 }));
        	vbox[add](this.tip());
        	vbox[add](this.command());
    	
    		this.notebook.append_page(grid, new Gtk.Label({ label: 'Basic Settings', visible: true, hexpand: true }));
	    	
	    	// End of Basic Settings Page
	    	
	    	// Arrange Button Order Page
	    	
		let grid2 = new Gtk.Grid({
        	column_spacing: 12, row_spacing: 12,
        	column_homogeneous: true,
        	hexpand: true, vexpand: true,
        	margin_start: 14, margin_end: 14, margin_top: 14, margin_bottom: 14,
        	visible: true
    		});
    
		let vbox2 = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10, visible: true });
    
    		grid2.attach(vbox2, 0, 0, 3, 1);
    
    		vbox2[add](this._arrangeButtonOrder());
    
    		this.notebook.append_page(grid2, new Gtk.Label({ label: 'Arrange Button Order', visible: true, hexpand: true }));
		}
		
_arrangeButtonOrder() {
		let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
		let arrangeButtonOrderLabel = new Gtk.Label({ label: "Arrange the Buttons Order Assuming you have All the 8 Buttons\n\
Orientation Button = 1 	Settings Button = 2 Lock Button = 3 Suspend Button = 4\n\
Switch User Button = 5	Logout Button = 6 Restart Button = 7 Poweroff Button =8\n\
for Example:\n\
[2, 4, 6, 8, 1, 3, 5, 7]\n\
[7, 5, 3, 1, 8, 6, 4, 2]", xalign: 0, hexpand: true });
	
		hbox[add](arrangeButtonOrderLabel);
	
		let orderEntry = new Gtk.Entry();
		const value = this._settings.get_value('buttons-order').deepUnpack().toString();
		orderEntry.set_text('[' + value + ']');
	    
		orderEntry.connect('changed', (entry) => {
					let string = entry.get_text();
					let ARRAY_INTEGER = GLib.Variant.parse(new GLib.VariantType('ai'), string, null, null);
					this._settings.set_value('buttons-order', ARRAY_INTEGER); });
	
		hbox[add](orderEntry);
	
		return hbox;
	
    		}
		
		// End of Arrange Button Order Page
	
_setButtonColor() {
        let rgba = new Gdk.RGBA();
        let hexString = this._settings.get_string('color');
        rgba.parse(hexString);
        this.BC_button.set_rgba(rgba);
    }
    
    
_cssHexString(css) {
        let rrggbb = '#';
        let start;
        for(let loop = 0; loop < 3; loop++) {
            let end = 0;
            let xx = '';
            for(let loop = 0; loop < 2; loop++) {
                while(true) {
                    let x = css.slice(end, end + 1);
                    if(x == '(' || x == ',' || x == ')')
                        break;
                    end = end + 1;
                }
                if(loop == 0) {
                    end = end + 1;
                    start = end;
                }
            }
            xx = parseInt(css.slice(start, end)).toString(16);
            if(xx.length == 1)
                xx = '0' + xx;
            rrggbb = rrggbb + xx;
            css = css.slice(end);
        }
        return rrggbb;
    }
    
_onPanelColorChanged() {
        let rgba = this.BC_button.get_rgba();
        let css = rgba.to_string();
        let hexString = this._cssHexString(css);
        this._settings.set_string('color', hexString);
    }    
    
selectButtonColor() {
	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, halign: Gtk.Align.END  });
	
	this.BC_button.connect('notify::rgba', ()=> this._onPanelColorChanged() );
	
	hbox[add](this.BC_button);
	
        return hbox;
    }
    
customColorButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
    	let customColorButtonLabel = new Gtk.Label({ label: "Use Custom Color for Buttons", xalign: 0, hexpand: true });
    	
        this.cCBToggleSwitch = new Gtk.Switch({ active: this._settings.get_boolean('use-custom-color') });
        this.cCBToggleSwitch.connect('notify::active', (button) => { this._settings.set_boolean('use-custom-color', button.active); });
    	
		hbox[add](customColorButtonLabel);
		hbox[add](this.cCBToggleSwitch)
      	
      	return hbox;
    } 
    
removeSuspendButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5  });
    	let removeSuspendButtonLabel = new Gtk.Label({ label: "Remove Suspend Button", xalign: 0, hexpand: true });
    	
        this.rSBLToggleSwitch = new Gtk.Switch({ active: this._settings.get_boolean('remove-suspend-button') });
        this.rSBLToggleSwitch.connect('notify::active', (button) => { this._settings.set_boolean('remove-suspend-button', button.active); }); 
    	
		hbox[add](removeSuspendButtonLabel);
		hbox[add](this.rSBLToggleSwitch)
		
      	return hbox;
    } 
    
removeLogoutButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
    	let removeLogoutButtonLabel = new Gtk.Label({ label: "Remove Logout Button", xalign: 0, hexpand: true });
    	
        this.rLBLToggleSwitch = new Gtk.Switch({ active: this._settings.get_boolean('remove-logout-button') });
        this.rLBLToggleSwitch.connect('notify::active', (button) => { this._settings.set_boolean('remove-logout-button', button.active); }); 
    	
		hbox[add](removeLogoutButtonLabel);
		hbox[add](this.rLBLToggleSwitch)
		
      	return hbox;
    }
    
removeRestartButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
    	let removeRestartButtonLabel = new Gtk.Label({ label: "Remove Restart Button", xalign: 0, hexpand: true });
    	
        this.rRBLToggleSwitch = new Gtk.Switch({ active: this._settings.get_boolean('remove-restart-button') });
        this.rRBLToggleSwitch.connect('notify::active', (button) => { this._settings.set_boolean('remove-restart-button', button.active); }); 
    	
		hbox[add](removeRestartButtonLabel);
		hbox[add](this.rRBLToggleSwitch);
		
      	return hbox;
    } 
    
removePoweroffButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
    	let removePoweroffButtonLabel = new Gtk.Label({ label: "Remove Poweroff Button", xalign: 0, hexpand: true });
    	
        this.rPBLToggleSwitch = new Gtk.Switch({ active: this._settings.get_boolean('remove-poweroff-button') });
        this.rPBLToggleSwitch.connect('notify::active', (button) => { this._settings.set_boolean('remove-poweroff-button', button.active); }); 
    	
		hbox[add](removePoweroffButtonLabel);
		hbox[add](this.rPBLToggleSwitch)
		
      	return hbox;
    } 
    
adjustIconSize() {
	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
	let IS_label = new Gtk.Label({ label: "Adjust Icon Size", xalign: 0, hexpand: true });

	this.IS_button = new Gtk.SpinButton();
	this.IS_button.set_range(12, 20);
	this.IS_button.set_value(this._settings.get_int('icon-size'));
	this.IS_button.set_increments(2, 4);
	this.IS_button.connect('value-changed', (entry) => { this._settings.set_int('icon-size', entry.get_value()); });
	
		hbox[add](IS_label);
		hbox[add](this.IS_button);
		
        return hbox;
    }
    
adjustPadding() {
        let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
        let PD_label = new Gtk.Label({ label: "Adjust Padding", xalign: 0, hexpand: true });

        this.PD_button = new Gtk.SpinButton();
	this.PD_button.set_range(0, 16);
	this.PD_button.set_value(this._settings.get_int('padding'));
	this.PD_button.set_increments(2, 4);
	this.PD_button.connect('value-changed', (entry) => { this._settings.set_int('padding', entry.get_value()); });
	
		hbox[add](PD_label);
		hbox[add](this.PD_button);

        return hbox;
    }  
    
adjustBorderRadius() {
	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
	let BR_label = new Gtk.Label({ label: "Adjust Border Raidus", xalign: 0, hexpand: true });
	this.BR_button = new Gtk.SpinButton();
	this.BR_button.set_range(0, 32);
	this.BR_button.set_value(this._settings.get_int('border-radius'));
	this.BR_button.set_increments(2, 4);
	this.BR_button.connect('value-changed', (entry) => { this._settings.set_int('border-radius', entry.get_value()); });
	
		hbox[add](BR_label);
		hbox[add](this.BR_button);

        return hbox;
    }
    
resetButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, halign: Gtk.Align.CENTER  });
    	let resetButton = new Gtk.Button();
        resetButton.set_label("Reset to Extensions's Default Size'es By Cliking this Button");
        resetButton.connect('clicked', ()=> {	
        	this._settings.set_int('icon-size', 16);
        	this._settings.set_int('padding', 8);
        	this._settings.set_int('border-radius', 16);
			this.IS_button.set_value(this._settings.get_int('icon-size'));
			this.PD_button.set_value(this._settings.get_int('padding'));
			this.BR_button.set_value(this._settings.get_int('border-radius'));
			
       		});
	
		hbox[add](resetButton);

        return hbox;
    }  
    
tip() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, halign: Gtk.Align.START  });
    	let tipLabel = new Gtk.Label({ label:
    	"you can tweak the BACKGROUND COLOR of these system menu buttons by edititng this extensions stylesheet.css file.\n\
Run below command to open the styles sheet file." });
    	
	hbox[add](tipLabel);
		
        return hbox;
    }     
    
command() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, margin_bottom: 20, halign: Gtk.Align.START  });
    	let command = new Gtk.Label({ label: "<b>gedit $HOME/.local/share/gnome-shell/extensions/roundedSystemMenuButtons@pratap.fastmail.fm/stylesheet.css</b>", useMarkup: true, selectable: true });
    	
		hbox[add](command);
      	
      	return hbox;
    } 
}
