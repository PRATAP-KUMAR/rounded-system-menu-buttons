const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gdk = imports.gi.Gdk;

const ExtensionUtils = imports.misc.extensionUtils;

function init() {
}

function buildPrefsWidget() {
    let widget = new PrefsWidget();
    return widget.widget;
}

class PrefsWidget {
    constructor() {
        this._settings = ExtensionUtils.getSettings();

        this.widget = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
        });

        this.vbox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            margin_top: 0,
            hexpand: true,
        });

        this.vbox.append(this.adjustIconSize());
        this.vbox.append(this.resetButton());
        this.vbox.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, margin_bottom: 10, margin_top: 10 }));
        this.vbox.append(this.tip());
        this.widget.append(this.vbox);
    }

        adjustIconSize() {
        let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5 });
        let adjust_label = new Gtk.Label({ label: "Adjust Icon Size", xalign: 0, hexpand: true });

        this.setSize = new Gtk.SpinButton();
	this.setSize.set_range(8, 32);
	this.setSize.set_value(this._settings.get_int('icon-size'));
	this.setSize.set_increments(2, 4);
	this.setSize.connect('value-changed', (entry) => { this._settings.set_int('icon-size', entry.get_value()); });
	
	hbox.append(adjust_label);
	hbox.append(this.setSize);

        return hbox;
    }
    
    	resetButton() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5, halign: Gtk.Align.START  });
    	this.resetButton = new Gtk.Button();
        this.resetButton.set_label("Reset to Extensions's Default Size By Cliking this Button");
        this.resetButton.connect('clicked', ()=> { this._settings.set_int('icon-size', 16);
        this.setSize.set_value(this._settings.get_int('icon-size'));});
	
	hbox.append(this.resetButton);

        return hbox;
    } 
    
    	tip() {
    	let hbox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, margin_top: 5  });
    	let tipLabel = new Gtk.Label({ label:
    	"you can tweak colors by edititng this extensions stylesheet.css file \nrun below command to open the styles sheet file \ngedit $HOME/.local/share/gnome-shell/extensions/roundedSystemMenuButtons@pratap.fastmail.fm", xalign: 0, hexpand: true });
    	
	hbox.append(tipLabel);

        return hbox;
    }     
}
