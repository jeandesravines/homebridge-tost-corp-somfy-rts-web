# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2023-01-02

### Changed

- (Breaking) feat(Configuration): Remove auto-discover (`devices` is now required in the Homebridge's configuration)
- feat(Configuration): Remove `devices.*.excluded`
- refactor(Request): Use the Webhook's commands instead of the REST's

### Added

- feat(Configuration): The device's name overrides the accessory's name

### Doc

- doc(Configuration): Mark `devices` as required

## [1.1.18] - 2022-07-25

### Fixed

- fix(Move): Avoid sending additional "stop" commands that cause Somfy device going to its preset location

### Changed

- chore(Dependencies): Upgrade dependencies

## [1.1.15] - 2022-06-12

### Changed

- chore(Dependencies): Upgrade dependencies

## [1.1.13] - 2022-06-09

### Added

- feat(Logger): Use Homebridge's logger

## [1.1.12] - 2022-01-03

### Fixed

- fix(Position): Avoid "pending" status
