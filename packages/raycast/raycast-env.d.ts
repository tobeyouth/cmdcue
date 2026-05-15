/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-operations` command */
  export type SearchOperations = ExtensionPreferences & {}
  /** Preferences accessible in the `ask-operations` command */
  export type AskOperations = ExtensionPreferences & {}
  /** Preferences accessible in the `settings` command */
  export type Settings = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-operations` command */
  export type SearchOperations = {}
  /** Arguments passed to the `ask-operations` command */
  export type AskOperations = {}
  /** Arguments passed to the `settings` command */
  export type Settings = {}
}

