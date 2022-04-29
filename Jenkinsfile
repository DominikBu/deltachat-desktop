pipeline {
    agent any 
    stages {
        stage('Build') { 
            steps {
                echo 'Building'
				sh 'docker-compose build buildsection'
				sh 'docker-compose logs > result'
            }
            post {
                failure {
                    echo 'Building failed'
					sh 'false'
                }
                success {
                    echo 'Building success'
                }
            }
        }
        stage('Test') { 
            steps {
                echo 'Testing'
				sh 'docker-compose build testsection'
				sh 'docker-compose up -d testsection'
            }
            post {
                failure {
                    echo 'Testing failed'
                    sh 'false'
                }
                success {
                    echo 'Testing success'
                }
            }
        }
        stage('Deploy') { 
            steps {
                echo 'Deploying'
            }
            post {
                failure {
                    echo 'Deploying failed'
                    sh 'false'
                }
                success {
                    echo 'Deploying success'
                }
            }
        }
    }
    post {
        failure {
            echo 'Ups, something went wrong.'
        }
        success {
            echo 'Pipeline complete!'
        }
    }
}