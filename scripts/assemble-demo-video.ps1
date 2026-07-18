[CmdletBinding()]
param(
    [switch]$PreviewWithReplayFallback,
    [string]$DeploymentUrl = ""
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
$submission = Join-Path $repo "docs\submission"
$replay = Join-Path $submission "raw-clips\replay-golden-path.webm"
$live = Join-Path $submission "raw-clips\live-voice-proof.webm"
$narration = Join-Path $submission "sishyaguru-demo-narration.wav"
$captions = Join-Path $submission "sishyaguru-demo-captions.srt"
$finalOutput = Join-Path $submission "sishyaguru-demo.mp4"
$output = $finalOutput
$isPreview = $false

function Require-Command([string]$Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found on PATH."
    }
}

function Require-File([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Required input is missing: $Path"
    }
}

Require-Command "ffmpeg"
Require-Command "ffprobe"
Require-File $replay
Require-File $narration
Require-File $captions

if (-not (Test-Path -LiteralPath $live -PathType Leaf)) {
    if (-not $PreviewWithReplayFallback) {
        Write-Warning "Authentic Live UI capture is not ready: $live"
        Write-Warning "No final video was created. Run again after capture, or use -PreviewWithReplayFallback for a clearly watermarked temporary assembly check."
        exit 2
    }

    $live = $replay
    $isPreview = $true
    $output = Join-Path $env:TEMP "sishyaguru-demo-assembly-preview.mp4"
}

$font = "C\:/Windows/Fonts/segoeui.ttf"
$fontBold = "C\:/Windows/Fonts/seguisb.ttf"
$filterFile = Join-Path $env:TEMP ("sishyaguru-demo-{0}.ffscript" -f [guid]::NewGuid())
$deploymentLine = if ($DeploymentUrl.Trim()) {
    $safeUrl = $DeploymentUrl.Trim().Replace("'", "").Replace(":", "\:")
    ",drawtext=fontfile='$font':text='$safeUrl':fontcolor=#a8b4c6:fontsize=26:x=120:y=810"
} else {
    ""
}
$previewLabel = if ($isPreview) {
    ",drawbox=x=0:y=998:w=1920:h=82:color=#9f1239@0.96:t=fill,drawtext=fontfile='$fontBold':text='ASSEMBLY PREVIEW - LIVE CAPTURE PENDING':fontcolor=white:fontsize=28:x=(w-text_w)/2:y=1022"
} else {
    ""
}

$filter = @"
[4:v]format=yuv420p,drawgrid=width=120:height=120:thickness=1:color=#4d7896@0.10,drawbox=x=120:y=370:w=360:h=6:color=#22d3b6:t=fill,drawbox=x=1300:y=300:w=22:h=22:color=#22d3b6:t=fill,drawbox=x=1500:y=465:w=22:h=22:color=#60a5fa:t=fill,drawbox=x=1280:y=640:w=22:h=22:color=#f7c873:t=fill,drawbox=x=1309:y=321:w=202:h=3:color=#31506b:t=fill,drawbox=x=1290:y=482:w=220:h=3:color=#31506b:t=fill,drawtext=fontfile='$fontBold':text='SISHYAGURU':fontcolor=#f5f7fb:fontsize=88:x=120:y=220,drawtext=fontfile='$font':text='You teach. AI learns. You master.':fontcolor=#a8b4c6:fontsize=42:x=120:y=410,drawtext=fontfile='$fontBold':text='REVERSE-TEACHING MASTERY COACH':fontcolor=#22d3b6:fontsize=24:x=124:y=510,fade=t=in:st=0:d=0.8,fade=t=out:st=14.5:d=0.5,setpts=PTS-STARTPTS[title];
[1:v]trim=duration=17,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#07111e,drawbox=x=820:y=34:w=224:h=58:color=#07111e@0.92:t=fill,drawtext=fontfile='$fontBold':text='REPLAY - PUBLIC':fontcolor=#22d3b6:fontsize=24:x=842:y=52,fade=t=in:st=0:d=0.2,fade=t=out:st=16.7:d=0.3[replayIntro];
[2:v]trim=duration=26,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#07111e,drawbox=x=820:y=34:w=202:h=58:color=#07111e@0.92:t=fill,drawtext=fontfile='$fontBold':text='LIVE - VOICE':fontcolor=#f7c873:fontsize=24:x=842:y=52$previewLabel,fade=t=in:st=0:d=0.2,fade=t=out:st=25.7:d=0.3[live];
[3:v]trim=duration=50,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=#07111e,drawbox=x=820:y=34:w=224:h=58:color=#07111e@0.92:t=fill,drawtext=fontfile='$fontBold':text='REPLAY - PUBLIC':fontcolor=#22d3b6:fontsize=24:x=842:y=52,fade=t=in:st=0:d=0.2,fade=t=out:st=49.7:d=0.3[replayLoop];
[5:v]format=yuv420p,drawgrid=width=120:height=120:thickness=1:color=#4d7896@0.08,drawtext=fontfile='$fontBold':text='LIVE PROVIDER PATH':fontcolor=#22d3b6:fontsize=26:x=120:y=112:enable='lt(t,14)',drawtext=fontfile='$fontBold':text='Voice candidate':fontcolor=#f5f7fb:fontsize=48:x=120:y=220:enable='lt(t,14)',drawtext=fontfile='$font':text='Review  ->  GPT-5.6  ->  exact-quote evidence':fontcolor=#a8b4c6:fontsize=34:x=120:y=310:enable='lt(t,14)',drawtext=fontfile='$font':text='Validated probe  ->  disclosed AI follow-up voice':fontcolor=#a8b4c6:fontsize=34:x=120:y=380:enable='lt(t,14)',drawtext=fontfile='$fontBold':text='PRIVACY AND SAFETY':fontcolor=#f7c873:fontsize=25:x=120:y=520:enable='lt(t,14)',drawtext=fontfile='$font':text='Store off  |  bounded inputs  |  no raw-audio persistence':fontcolor=#f5f7fb:fontsize=31:x=120:y=585:enable='lt(t,14)',drawtext=fontfile='$fontBold':text='VERIFIED RELEASE GATES':fontcolor=#22d3b6:fontsize=26:x=120:y=182:enable='gte(t,14)',drawtext=fontfile='$fontBold':text='35':fontcolor=#f5f7fb:fontsize=92:x=120:y=300:enable='gte(t,14)',drawtext=fontfile='$font':text='domain tests':fontcolor=#a8b4c6:fontsize=30:x=125:y=415:enable='gte(t,14)',drawtext=fontfile='$fontBold':text='12':fontcolor=#f5f7fb:fontsize=92:x=650:y=300:enable='gte(t,14)',drawtext=fontfile='$font':text='Replay scenarios':fontcolor=#a8b4c6:fontsize=30:x=655:y=415:enable='gte(t,14)',drawtext=fontfile='$fontBold':text='7':fontcolor=#f5f7fb:fontsize=92:x=1250:y=300:enable='gte(t,14)',drawtext=fontfile='$font':text='Live scenarios':fontcolor=#a8b4c6:fontsize=30:x=1255:y=415:enable='gte(t,14)',drawtext=fontfile='$font':text='Typed contracts  |  responsive UI  |  adversarial browser checks':fontcolor=#f7c873:fontsize=29:x=120:y=590:enable='gte(t,14)',fade=t=in:st=0:d=0.4,fade=t=out:st=26.5:d=0.5,setpts=PTS-STARTPTS[architecture];
[6:v]format=yuv420p,drawgrid=width=120:height=120:thickness=1:color=#4d7896@0.10,drawbox=x=120:y=360:w=360:h=6:color=#22d3b6:t=fill,drawtext=fontfile='$fontBold':text='SISHYAGURU':fontcolor=#f5f7fb:fontsize=82:x=120:y=214,drawtext=fontfile='$font':text='Master by teaching.':fontcolor=#a8b4c6:fontsize=42:x=120:y=405,drawtext=fontfile='$fontBold':text='github.com/AtchayamG/SishyaGuru':fontcolor=#22d3b6:fontsize=30:x=120:y=725$deploymentLine,fade=t=in:st=0:d=0.4,fade=t=out:st=9.724:d=0.5,setpts=PTS-STARTPTS[close];
[title][replayIntro][live][replayLoop][architecture][close]concat=n=6:v=1:a=0,trim=duration=145.224,setpts=PTS-STARTPTS[v];
[0:a]aresample=48000,apad=whole_dur=145.224,atrim=duration=145.224,afade=t=out:st=144.824:d=0.4[a]
"@

try {
    [IO.File]::WriteAllText($filterFile, $filter, [Text.UTF8Encoding]::new($false))
    if ((Test-Path -LiteralPath $finalOutput) -and $isPreview) {
        Write-Verbose "Preview mode leaves the existing final output untouched."
    }

    $arguments = @(
        "-hide_banner", "-loglevel", "warning", "-nostats", "-y",
        "-i", $narration,
        "-stream_loop", "-1", "-i", $replay,
        "-stream_loop", "-1", "-i", $live,
        "-stream_loop", "-1", "-i", $replay,
        "-f", "lavfi", "-t", "15", "-i", "color=c=#08111f:s=1920x1080:r=30",
        "-f", "lavfi", "-t", "27", "-i", "color=c=#08111f:s=1920x1080:r=30",
        "-f", "lavfi", "-t", "10.224", "-i", "color=c=#08111f:s=1920x1080:r=30",
        "-/filter_complex", $filterFile,
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "30",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
        "-movflags", "+faststart", "-shortest", $output
    )

    & ffmpeg @arguments
    if ($LASTEXITCODE -ne 0) { throw "FFmpeg assembly failed with exit code $LASTEXITCODE." }

    $probe = (& ffprobe -v error -show_entries "format=duration:stream=codec_type,codec_name,width,height" -of json $output) | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw "ffprobe could not read the assembled video." }
    $video = $probe.streams | Where-Object codec_type -eq "video" | Select-Object -First 1
    $audio = $probe.streams | Where-Object codec_type -eq "audio" | Select-Object -First 1
    $duration = [double]$probe.format.duration
    if ($video.codec_name -ne "h264" -or $video.width -ne 1920 -or $video.height -ne 1080) { throw "Unexpected video stream: $($video | ConvertTo-Json -Compress)" }
    if ($audio.codec_name -ne "aac") { throw "Unexpected audio stream: $($audio | ConvertTo-Json -Compress)" }
    if ($duration -lt 144.9 -or $duration -gt 145.6) { throw "Unexpected runtime: $duration seconds." }

    Write-Host ("Verified {0}: {1:N3}s, 1920x1080, H.264/AAC" -f $output, $duration)
    if ($isPreview) { Write-Warning "This is a watermarked assembly preview, not the submission video." }
}
finally {
    if (Test-Path -LiteralPath $filterFile) { Remove-Item -LiteralPath $filterFile -Force }
}
