/**
 * TODO support other encodings:
 * http://stackoverflow.com/questions/7329128/how-to-write-binary-data-to-a-file-using-node-js
 */
Meteor.methods({
    saveFile: function(blob,  path, encoding) {
        var user = Meteor.userId()
        if (!Date.now) { //IE8 Support
            Date.now = function() { return new Date().getTime(); }
        }
        
        var time = Date.now();
        var format = "jpg";
        
        
        Photos.update({
            user: user
        }, {
            $set: {
                timestamp: time,
                format: format
            }
        }, {
            upsert: true
        });
        
        var name = user + "_" + time + "." + format;
        
        var path = cleanPath(path),
            fs = Npm.require('fs'),
            name = cleanName(name || 'file'),
            encoding = encoding || 'binary',
            chroot = Meteor.chroot || '../../../../../public/photos~';

        // Clean up the path. Remove any initial and final '/' -we prefix them-,
        // any sort of attempt to go to the parent directory '..' and any empty directories in
        // between '/////' - which may happen after removing '..'
        path = chroot + (path ? '/' + path + '/' : '/');

        console.log(path);
        console.log(name);
        
        // TODO Add file existance checks, etc...
        fs.writeFileSync(path + name, blob, encoding, function(err) {
            if (err) {
            throw (new Meteor.Error(500, 'Failed to slave file.', err));
            } else {
            console.log('The file ' + name + ' (' + encoding + ') was saved to ' + path);
            }
        }); 

        function cleanPath(str) {
            if (str) {
                return str.replace(/\.\./g,'').replace(/\/+/g,'').
                replace(/^\/+/,'').replace(/\/+$/,'');
            }
        }
        function cleanName(str) {
            return str.replace(/\.\./g,'').replace(/\//g,'');
        }
        
       
    }
});