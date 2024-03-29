//
//  ModuleManifest.swift
//  App
//
//  Created by Julia Samol on 08.02.23.
//

import Foundation

struct ModuleManifest: Codable {
    let name: String
    let version: String
    let author: String
    let url: String?
    let email: String?
    let repository: String?
    let publicKey: String
    let description: String
    let src: Src?
    let res: Res?
    let include: [String]
    let jsenv: JSEnv?
    
    struct Src: Codable {
        let namespace: String?
    }
    
    struct Res: Codable {
        let symbol: [String: String]
    }
    
    struct JSEnv: Codable {
        let ios: JSEnvironmentKind?
    }
}
