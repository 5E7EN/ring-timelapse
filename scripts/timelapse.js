// Copyright (c) Wictor Wilén. All rights reserved.
// Licensed under the MIT license.

const { writeFileSync, rmSync, existsSync, readdirSync, lstatSync } = require('fs');
const path = require('path');
const FfmpegCommand = require('fluent-ffmpeg');

const targetDir = '../target';

async function timelapse() {
    const folders = readdirSync(path.resolve(__dirname, targetDir));
    folders.forEach((f) => {
        if (lstatSync(path.resolve(__dirname, targetDir, f)).isDirectory()) {
            console.log(f);

            let command = FfmpegCommand();

            const files = readdirSync(path.resolve(__dirname, targetDir, f));
            let template = '';
            const templateFilePath = path.resolve(__dirname, targetDir, f + '-' + Date.now() + '.txt');

            command.on('error', (err) => {
                console.log('An error occurred: ' + err.message);
            });

            // Cleanup commands once timelapse is done
            command.on('end', () => {
                console.log('Merging finished!');
                // console.log('Merging finished, removing snapshot images!');
                // for (const file of files) {
                //     rmSync(path.resolve(__dirname, "target", f, file));
                // }
                // rmSync(templateFilePath);
                // console.log("Done!");
            });

            // add all the image files
            for (const file of files.sort((a, b) => {
                return lstatSync(path.resolve(__dirname, targetDir, f, a)).mtimeMs - lstatSync(path.resolve(__dirname, targetDir, f, b)).mtimeMs;
            })) {
                console.log(`Adding ${file}`);
                template += `file ${path.resolve(__dirname, targetDir, f, file)}\n`;
            }

            // add the last file on additional time
            template += `file ${path.resolve(__dirname, targetDir, f, files[files.length - 1])}\n`;

            // write the template file to disk
            writeFileSync(templateFilePath, template);

            // configure ffmpeg
            command.fpsOutput(24);
            command.addInput(templateFilePath);
            command.inputOptions(['-f', 'concat', '-safe', '0']);
            command.videoCodec('libx264');
            command.noAudio();
            command.format('mp4');

            // persist the file
            command.save(path.resolve(__dirname, targetDir, f + '-' + Date.now() + '.mp4'));
        }
    });
}

timelapse();
