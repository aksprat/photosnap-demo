# PhotoSnap Terraform Infrastructure

provider "digitalocean" {
  token = var.do_token
}

variable "do_token" {}
variable "db_name" { default = "photosnap" }
variable "db_user" { default = "photosnapuser" }
variable "db_password" {}
variable "space_name" { default = "photosnap-space" }
variable "region" { default = "sgp1" }

resource "digitalocean_postgresql_cluster" "photosnap_db" {
  name       = var.db_name
  engine     = "pg" 
  version    = "15"
  size       = "db-s-1vcpu-1gb"
  region     = var.region
  node_count = 1

  user     = var.db_user
  password = var.db_password
}

resource "digitalocean_spaces_bucket" "photosnap_space" {
  name   = var.space_name
  region = var.region
  acl    = "public-read"
}

resource "digitalocean_app" "photosnap_app" {
  spec {
    name = "photosnap"

    services {
      name = "backend"
      github {
        repo   = "your-github-username/photosnap"
        branch = "main"
      }
      envs = [
        {
          key   = "DATABASE_URL"
          value = digitalocean_postgresql_cluster.photosnap_db.uri
          scope = "RUN_AND_BUILD_TIME"
        },
        {
          key   = "SPACES_BUCKET"
          value = digitalocean_spaces_bucket.photosnap_space.name
          scope = "RUN_AND_BUILD_TIME"
        },
        {
          key   = "SPACES_REGION"
          value = var.region
          scope = "RUN_AND_BUILD_TIME"
        }
      ]
      run_command     = "node server.js"
      dockerfile_path = "backend/Dockerfile"
      http_port       = 3000
    }

    static_sites {
      name = "frontend"
      github {
        repo   = "your-github-username/photosnap"
        branch = "main"
      }
      output_dir = "frontend"
    }
  }
}
