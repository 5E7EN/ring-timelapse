// Copyright (c) Wictor Wilén. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import dotenv from 'dotenv';
import camelCase from 'lodash.camelcase';
import { RingApi } from 'ring-client-api';
import { promises as fs } from 'fs';

// Load environment variables from .env file
dotenv.config();

function log(message: string) {
    console.log(`${new Date().toISOString()}: ${message}`);
}

async function pathExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function saveSnapshots() {
    log('Executing snapshot task -');

    // Create Ring API instance
    const ringApi = new RingApi({
        refreshToken: process.env.TOKEN as string,
        debug: true // false
    });

    // Get all cameras
    const cameras = await ringApi.getCameras();

    // Create target folder if it doesn't exist
    if (!(await pathExists(path.resolve(__dirname, 'target')))) {
        await fs.mkdir(path.resolve(__dirname, 'target'));
        log('Target folder did not exist and was created.');
    }

    // Loop through all cameras and take a snapshot
    for (const camera of cameras) {
        const cameraName = camera.name;
        const cameraNameCased = camelCase(cameraName);

        log(`[${cameraName}] Retrieving snapshot...`);

        try {
            // Take snapshot
            const snapshot = await camera.getSnapshot();

            // Save snapshot
            try {
                // Create camera snapshots folder if it doesn't exist
                if (!(await pathExists(path.resolve(__dirname, 'target', cameraNameCased)))) {
                    log(`[${cameraName}] Snapshot folder did not exist and was created.`);
                    await fs.mkdir(path.resolve(__dirname, 'target', cameraNameCased));
                }

                // Save snapshot to camera folder
                await fs.writeFile(path.resolve(__dirname, 'target', path.join(cameraNameCased, Date.now() + '.png')), snapshot);
                log(`[${cameraName}] Snapshot saved!`);
            } catch (error) {
                log(`[${cameraName}] Error encountered while saving snapshot: ${error}`);
            }
        } catch (error) {
            log(`[${cameraName}] Error encountered while taking snapshot: ${error}`);
        }
    }

    log('---');
}

saveSnapshots();
