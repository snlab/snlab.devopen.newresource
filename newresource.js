define(function(require, exports, module) {
    "use strict";

    main.consumes = [
        "Plugin", "c9", "ui", "menus", "tabManager", "commands", "tree", "Form", "Dialog", "proc", "Divider"
    ];
    main.provides = ["newresource"];
    return main;

    function main(options, imports, register) {
        var Plugin = imports.Plugin;
        var c9 = imports.c9;
        var ui = imports.ui;
        var menus = imports.menus;
        var commands = imports.commands;
        var tabs = imports.tabManager;
        var tree = imports.tree;
        var Form = imports.Form;
        var Dialog = imports.Dialog;
        var proc = imports.proc;
        var Divider = imports.Divider;

        var templates = options.templates || require("text!./default.templates");

        /***** Initialization *****/

        var plugin = new Plugin("Ajax.org", main.consumes);
        // var emit = plugin.getEmitter();

        var readonly = c9.readonly;
        var defaultExtension = "";

        var loaded = false;
        function load(callback) {
            if (loaded) return false;
            loaded = true;

            commands.addCommand({
                name: "newfile",
                hint: "create a new file resource",
                msg: "New file created.",
                bindKey: { mac: "Ctrl-N", win: "Alt-N" },
                exec: function () { newFile(); }
            }, plugin);

            // commands.addCommand({
            //     name: "newfiletemplate",
            //     hint: "open the new file template dialog",
            //     msg: "New directory created.",
            //     bindKey: { mac: "Ctrl-Shift-N", win: "Ctrl-Shift-N" },
            //     exec: function() { newFileTemplate(); }
            // }, plugin);

            commands.addCommand({
                name: "newfolder",
                hint: "create a new directory resource",
                exec: function(){ newFolder(); }
            }, plugin);

            commands.addCommand({
              name: "fasttemplate",
              hint: "create a FAST project with the template",
              exec: function(){ callFastDialog();
            }
           }, plugin);

            /**--menus.addItemByPath("File/New File", new ui.item({
                disabled: readonly,
                command: "newfile"
            }), 100, plugin); --**/
            menus.addItemByPath("File/New", new ui.item({
                disabled: readonly,
            }), 200, plugin);
            menus.addItemByPath("File/New/Empty FAST App", new ui.item({
                disabled: readonly,
            }), 210, plugin);
            menus.addItemByPath("File/New/FAST App from Template", new ui.item({
                command: "fasttemplate"
            }), 220, plugin);
            menus.addItemByPath("File/New/~", new ui.divider(), 320, plugin);
            menus.addItemByPath("File/New/Empty Maple App", new ui.item({
                disabled: readonly,
            }), 330, plugin);
            menus.addItemByPath("File/New/Maple App from Template", new ui.item({
                command: "mapletemplate"
            }), 340, plugin);

            // menus.addItemByPath("File/New Folder", new ui.item({
            //     disabled: readonly,
            //     command: "newfolder"
            // }), 300, plugin);
            // menus.addItemByPath("File/~", new ui.divider(), 400, plugin);

            addFileTemplate(templates, plugin);
        }

        /***** Methods *****/

        function getDirPath () {
            var node = tree.getSelectedNode();
            var path = node.path || node.getAttribute("path");
            if (node.getAttribute ? node.getAttribute("type") == "file"
              || node.tagName == "file" : !node.isFolder)
                path = path.replace(/\/[^\/]*$/, "/");

            if (!/\/$/.test(path))
                path += "/";

            return path;
        }

        function newFile(type, value, path) {
            if (readonly) return;

            var filePath;
            var name = "Untitled";
            var count = 1;
            type = type || "";
            path = path || getDirPath();
            var ext = defaultExtension;

            while (tabs.findTab(filePath = path + name + (count || "") + type + ext))
                count++;

            tabs.open({
                path: filePath,
                value: value || "",
                active: true,
                document: {
                    meta: {
                        newfile: true
                    }
                }
            }, function(err, tab) {
                if (err)
                    return; // reported already
            });

            // ide.dispatchEvent("track_action", {type: "template", template: type});
        }

        function newFolder(path, callback) {
            tree.createFolder(path, false, callback || function(){});
        }

        var projectname;
        var version;
        var fastpackage;
        var classprefix;
        var templateform;
        var jsonForm;

        templateform = new Form({
          rowheight: 40,
          colwidth: 100,
          edge: "5 5 10 5",
          form:[
            {
              title: "Project name",
              name: "projectname",
              type: "textbox",
              defaultValue: "simple-test",
              // margin: "20 20 5 20",
            },
            {
              title: "Version",
              name: "version",
              type: "textbox",
              defaultValue: "1.0.0-SNAPSHOT"
              // margin: "20 20 5 20",
            },
            {
              title: "Package",
              name: "fastpackage",
              type: "textbox",
              defaultValue: "fast.simple.test"
              // margin: "20 20 5 20",
            },
            {
              title: "Class prefix",
              name: "classprefix",
              type: "textbox",
              defaultValue: "FastSimpleTest"
              // margin: "20 20 5 20",
            }
    ]
        });

        function startTemplate(){
          jsonForm = templateform.toJson();
          projectname = jsonForm.projectname;
          version = jsonForm.version;
          fastpackage = jsonForm.fastpackage;
          classprefix = jsonForm.classprefix;

          proc.spawn("mvn", {
            args: [
              "archetype:generate",
              "-DarchetypeGroupId=test.fast",
              "-DarchetypeArtifactId=fast-app-archetype",
              "-DarchetypeVersion=1.0.0-SNAPSHOT",
              "-DgroupId=fast.app",
              "-DartifactId=" + projectname,
              "-Dversion=" + version,
              "-Dpackage=" + fastpackage,
              "-DclassPrefix=" + classprefix,
              "-Dcopyright=SNLab",
              "-DcopyrightYear=2016",
              "-DinteractiveMode=false"
            ],
            cwd: c9.workspaceDir,
          },
          function(err, process){
            if (err) throw err;
            process.stdout.on("data", function(chunk) {
              console.log(chunk);
          });
        });
      }

        var fastDialog = new Dialog("fastDialog", main.consumes, {
          name: "create-a-fast-project",
          allowClose: true,
          title: "Create a FAST project",
          elements: [
            {
              type: "button",
              id: "cancel",
              color: "grey",
              caption: "Cancel",
              hotkey: "ESC",
              onclick: function(){ fastDialog.hide() }
            },
            {
              type: "button",
              id: "ok",
              color: "green",
              caption: "OK",
              default: true,
              onclick: function(){
                startTemplate();
                fastDialog.hide();
              }
            }
          ]
        });

        fastDialog.on("draw", function(e){
          templateform.attachTo(e.html);
        });

        function callFastDialog(){
          fastDialog.show();
        }

        function parse(data){
            var list = [];
            var context = { template: [] };
            list.push(context);

            var restart;
            data.split("\n").forEach(function(line){
                if (/^(?:\t| {4})(.*)/.test(line)) {
                    context.template.push(RegExp.$1);
                    restart = true;
                    return;
                }
                else if (restart) {
                    list.push(context = { template: [] });
                    restart = false;
                }

                if (!line) return;

                var m = line.match(/^(\w+) (.*)$/);
                if (m)
                    context[m[1]] = m[2];
            });

            return list;
        }

        function addFileTemplate(data, forPlugin) {
            // if (!plugin.loaded) return;

            var list = parse(data);

            list.forEach(function(item){
                menus.addItemByPath("File/New From Template/" + item.caption, new ui.item({
                    disabled: readonly,
                    onclick: function(){
                        newFile(item.filename, item.template.join("\n"));
                    }
                }), 200, forPlugin);
            });

            // plugin.addOther(function(){
            //     list.forEach(functon(item){
            //         delete templates[name];
            //     });
            // });
        }

        /***** Lifecycle *****/

        plugin.on("load", function(){
            load();
        });
        plugin.on("unload", function(){
            loaded = false;
            defaultExtension = null;
        });

        /***** Register and define API *****/

        /**
         * Adds File->New File and File->New Folder menu items as well as the
         * commands for opening a new file as well as an API.
         * @singleton
         **/
        plugin.freezePublicAPI({
            /**
             * Create a new file in the workspace
             *
             * @param {String} type   The encoding of the content for the file
             * @param {String} value  The content of the file
             * @param {String} path   The path of the file to write
             */
            newFile: newFile,

            /**
             * Create a new folder in the workspace and starts its renaming
             *
             * @param {String}   name          The name of the folder to create
             * @param {String}   dirPath       The directory to create the folder into
             * @param {Function} callback      Called after the folder is created
             * @param {Error}    callback.err  The error object if any error occured.
             */
            newFolder: newFolder,

            /**
             *
             */
            open: open,

            /**
             *
             */
            addFileTemplate: addFileTemplate,

            /**
             * Sets the default extension for newly created files
             * @param extension  The default extension to use
             */

             templateform: templateform,

             fastDialog: fastDialog,


            set defaultExtension(extension) {
                defaultExtension = extension ? "." + extension : "";
                tree.defaultExtension = extension;
            }
        });

        register(null, {
            newresource: plugin
        });
    }
});
