///<reference path="../typings/main.d.ts" />
import tl = require("vsts-task-lib/task");
import common = require("./common");

common.runTfx(tfx => {
    tfx.arg(["extension", "create", "--json"]);
    const outputVariable = tl.getInput("outputVariable", false);

    // Set tfx manifest arguments
    const cleanupTfxArgs = common.setTfxManifestArguments(tfx);

    // Set vsix output path
    const outputPath = tl.getInput("outputPath", false);
    tfx.argIf(outputPath, ["--output-path", outputPath]);

    // Aditional arguments
    tfx.arg(tl.getInput("arguments", false));

    // Set working directory
    const cwd = tl.getInput("cwd", false);
    if (cwd) { tl.cd(cwd); }

    // Before executing check update on tasks version
    common.checkUpdateTasksVersion().then(() => {
        const outputStream = new common.TfxJsonOutputStream();

        tfx.exec(<any>{ outStream: outputStream, failOnStdErr: true }).then(code => {
            const json = JSON.parse(outputStream.jsonString);

            if (outputVariable) {
                tl.setVariable(outputVariable, json.path);
            }

            tl._writeLine(`Packaged extension: ${json.path}.`);
            tl.setResult(tl.TaskResult.Succeeded, `tfx exited with return code: ${code}`);
        }).fail(err => {
            tl.setResult(tl.TaskResult.Failed, `tfx failed with error: ${err}`);
        }).finally(() => {
            cleanupTfxArgs();
        });
    }).fail(err => {
        tl.setResult(tl.TaskResult.Failed, `Error occurred while updating tasks version: ${err}`);
    });
});