# Ring Timelapse generator

A Docker container that periodically takes snapshots from your [Ring](https://www.ring.com) cameras and then creates timelapse videos of the snapshots.

[![Docker Image Version (tag latest semver)](https://img.shields.io/docker/v/5e7en/ring-timelapse/latest)](https://hub.docker.com/repository/docker/5e7en/ring-timelapse)
[![MIT License](https://img.shields.io/apm/l/atomic-design-ui.svg?)](https://github.com/5e7en/ring-timelapse/blob/main/LICENSE.md)

## Features

-   Takes snapshots of all Ring cameras periodically, default 15 seconds
-   Runs as a Docker container with minimal footprint

> **NOTE**: Taking snapshots often will drain the battery faster than normal.

## Installation

In order to run the Docker container you need a Ring refresh token.
To generate the token use the following command:

```bash
npx -p ring-client-api ring-auth-cli
```

Use the following to pull the latest Docker image from Docker hub.

```bash
docker pull 5e7en/ring-timelapse
```

Before starting the container, create a directory that will be shared with the
container to persist the snapshots and timelapses, for instance:

```bash
cd /media
mkdir timelapse
```

Next, copy the `.env.example` file to `.env` and populate the values with your refresh token and desired options.

Start the container by running:

```bash
docker run --name my-ring-timelapse \
  -d \
  --env-file .env \
  -v "/media/timelapse:/app/target" \
  --restart unless-stopped \
  5e7en/ring-timelapse
```

> **NOTE**: In the `-v` argument replace the local path (`/media/timelapse`) with the directory you created

## Environment Variables

The following variables are required:

`TOKEN` - your generated Ring token, see Installation

The following variables are optional:

`SNAPSHOT_INTERVAL_SECONDS` - Interval for taking snapshots in seconds. Default: 15

## Authors

-   [@wictorwilen](https://www.github.com/wictorwilen)
-   [@5E7EN](https://www.github.com/5e7en)

## License

[MIT](https://choosealicense.com/licenses/mit/)
