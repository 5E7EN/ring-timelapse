// Copyright (c) Wictor Wilén. All rights reserved.
// Licensed under the MIT license.

import path from 'path';
import camelCase from 'lodash.camelcase';
import dotenv from 'dotenv';
import { RingApi } from 'ring-client-api';
import { promises as fs, readFile, writeFile } from 'fs';
import { promisify } from 'util';

dotenv.config();

const targetDir = '../target';

// Parse snapshot interval
const snapshotInterval = process.env.SNAPSHOT_INTERVAL_SECONDS ? parseInt(process.env.SNAPSHOT_INTERVAL_SECONDS) : 15;

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

    // Listen for refresh token updates
    ringApi.onRefreshTokenUpdated.subscribe(async ({ newRefreshToken, oldRefreshToken }) => {
        // If you are implementing a project that use `ring-client-api`, you should subscribe to onRefreshTokenUpdated and update your config each time it fires an event
        // Here is an example using a .env file for configuration
        if (!oldRefreshToken) {
            return;
        }

        const currentConfig = await promisify(readFile)('.env'),
            updatedConfig = currentConfig.toString().replace(oldRefreshToken, newRefreshToken);

        await promisify(writeFile)('.env', updatedConfig);
    });

    // Get all cameras
    const cameras = await ringApi.getCameras();

    // Create target folder if it doesn't exist
    if (!(await pathExists(path.resolve(__dirname, targetDir)))) {
        await fs.mkdir(path.resolve(__dirname, targetDir));
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
                if (!(await pathExists(path.resolve(__dirname, targetDir, cameraNameCased)))) {
                    log(`[${cameraName}] Snapshot folder did not exist and was created.`);
                    await fs.mkdir(path.resolve(__dirname, targetDir, cameraNameCased));
                }

                // Save snapshot to camera folder
                await fs.writeFile(path.resolve(__dirname, targetDir, path.join(cameraNameCased, Date.now() + '.png')), snapshot);
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

log(`Starting snapshot task, taking snapshots every ${snapshotInterval} seconds... GLHF!`);
setInterval(saveSnapshots, 1000 * snapshotInterval);
saveSnapshots();
